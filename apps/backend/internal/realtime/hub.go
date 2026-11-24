package realtime

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

const eventsChannel = "realtime:events"

// Publisher broadcasts realtime events.
type Publisher interface {
	Publish(ctx context.Context, event Event) error
}

// outbound is a client-facing payload plus its optional delivery set. targets
// is built once at enqueue time so the fan-out loop does not re-parse the
// payload per client, and is nil for a public event.
//
// payload is already stripped of the recipient list: see Event.forClient.
type outbound struct {
	payload []byte
	targets map[string]struct{}
}

// Hub manages realtime clients and fan-out.
type Hub struct {
	rdb        *redis.Client
	signer     *Signer
	register   chan *Client
	unregister chan *Client
	broadcast  chan outbound
	clients    map[*Client]struct{}
	subReady   chan struct{}
	subOnce    sync.Once
}

// NewHub initializes a realtime hub.
func NewHub(rdb *redis.Client) *Hub {
	h := &Hub{
		rdb:        rdb,
		signer:     NewSignerFromEnv(),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan outbound, 128),
		clients:    make(map[*Client]struct{}),
		subReady:   make(chan struct{}),
	}
	if rdb == nil {
		h.markSubReady()
	}
	return h
}

// Run starts the hub event loop.
func (h *Hub) Run(ctx context.Context) {
	if h.rdb != nil {
		go h.subscribeRedis(ctx)
	}
	for {
		select {
		case <-ctx.Done():
			for client := range h.clients {
				delete(h.clients, client)
				close(client.send)
			}
			return
		case client := <-h.register:
			h.clients[client] = struct{}{}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case msg := <-h.broadcast:
			for client := range h.clients {
				// Targeted events reach only those users' connections; anonymous
				// clients (empty userID) never match one.
				if msg.targets != nil {
					if _, ok := msg.targets[client.userID]; !ok {
						continue
					}
				}
				select {
				case client.send <- msg.payload:
				default:
					delete(h.clients, client)
					close(client.send)
				}
			}
		}
	}
}

// Publish sends an event to all subscribers, or to the connections of
// Event.TargetUserIds when that is set.
//
// Two payloads are built, not one. The inter-instance payload keeps the
// recipient list so every instance can pick out its own connections; the
// client payload drops it, because the list is the follower set of whoever the
// event is about.
func (h *Hub) Publish(ctx context.Context, event Event) error {
	if err := event.Validate(); err != nil {
		return err
	}
	clientPayload, err := json.Marshal(event.forClient())
	if err != nil {
		return err
	}
	if h.rdb == nil {
		h.enqueue(clientPayload, event.targets())
		return nil
	}

	internalPayload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	wirePayload := internalPayload
	if h.signer != nil {
		wirePayload, err = json.Marshal(signedMessage{
			Payload: internalPayload,
			Sig:     h.signer.Sign(internalPayload),
		})
		if err != nil {
			return err
		}
	}
	if err := h.rdb.Publish(ctx, eventsChannel, wirePayload).Err(); err != nil {
		// Redis is the path to the other instances. With it down, at least
		// serve the connections attached to this one.
		h.enqueue(clientPayload, event.targets())
		return err
	}
	return nil
}

func (h *Hub) enqueue(payload []byte, targets map[string]struct{}) {
	select {
	case h.broadcast <- outbound{payload: payload, targets: targets}:
	default:
	}
}

func (h *Hub) subscribeRedis(ctx context.Context) {
	pubsub := h.rdb.Subscribe(ctx, eventsChannel)
	defer func() {
		_ = pubsub.Close()
	}()
	_, err := pubsub.Receive(ctx)
	h.markSubReady()
	if err != nil {
		return
	}
	ch := pubsub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			h.handleRedisPayload([]byte(msg.Payload))
		}
	}
}

func (h *Hub) markSubReady() {
	h.subOnce.Do(func() {
		close(h.subReady)
	})
}

// WaitReady blocks until redis subscription is ready.
func (h *Hub) WaitReady(ctx context.Context) bool {
	select {
	case <-h.subReady:
		return true
	case <-ctx.Done():
		return false
	}
}

// Register adds a client to the hub.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

type signedMessage struct {
	Payload json.RawMessage `json:"payload"`
	Sig     string          `json:"sig"`
}

func (h *Hub) handleRedisPayload(payload []byte) {
	if len(payload) == 0 {
		return
	}
	if h.signer == nil {
		h.handlePayload(payload)
		return
	}
	var signed signedMessage
	if err := json.Unmarshal(payload, &signed); err != nil {
		return
	}
	if len(signed.Payload) == 0 || strings.TrimSpace(signed.Sig) == "" {
		return
	}
	if !h.signer.Verify(signed.Payload, signed.Sig) {
		return
	}
	h.handlePayload(signed.Payload)
}

func (h *Hub) handlePayload(payload []byte) {
	if len(payload) > maxPayloadBytes {
		return
	}
	var event Event
	if err := json.Unmarshal(payload, &event); err != nil {
		return
	}
	if err := event.Validate(); err != nil {
		return
	}
	targets := event.targets()
	if targets == nil {
		// Public event: nothing to strip, so the payload as received is already
		// what a client should get.
		h.enqueue(payload, nil)
		return
	}
	// Re-marshal without the recipient list. Once per instance per event, not
	// once per recipient, which is the whole point of batching them.
	clientPayload, err := json.Marshal(event.forClient())
	if err != nil {
		return
	}
	h.enqueue(clientPayload, targets)
}

// Client represents a websocket connection.
type Client struct {
	hub *Hub
	// userID is the authenticated user's ID, or "" for anonymous connections.
	// Targeted events are only delivered to matching clients.
	userID string
	conn   *websocket.Conn
	send   chan []byte
	close  func()
}

const (
	writeWait       = 10 * time.Second
	pongWait        = 60 * time.Second
	pingPeriod      = (pongWait * 9) / 10
	maxMessageSize  = 512
	maxPayloadBytes = 1 << 20
)

// NewClient builds a new realtime client. userID is "" for anonymous connections.
func NewClient(hub *Hub, conn *websocket.Conn, userID string, onClose func()) *Client {
	return &Client{
		hub:    hub,
		userID: userID,
		conn:   conn,
		send:   make(chan []byte, 16),
		close:  onClose,
	}
}

// Run registers the client and pumps messages.
func (c *Client) Run() {
	c.hub.Register(c)
	go c.writePump()
	c.readPump()
}

// SendChan exposes the outbound messages channel.
func (c *Client) SendChan() <-chan []byte {
	return c.send
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		_ = c.conn.Close()
		if c.close != nil {
			c.close()
		}
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			return
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
