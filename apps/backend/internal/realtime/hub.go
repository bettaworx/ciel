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

const timelineChannel = "realtime:timeline"

// Publisher broadcasts realtime events.
type Publisher interface {
	Publish(ctx context.Context, event Event) error
}

// Hub manages realtime clients and fan-out.
type Hub struct {
	rdb        *redis.Client
	signer     *Signer
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
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
		broadcast:  make(chan []byte, 128),
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
				select {
				case client.send <- msg:
				default:
					delete(h.clients, client)
					close(client.send)
				}
			}
		}
	}
}

// Publish sends an event to all subscribers.
func (h *Hub) Publish(ctx context.Context, event Event) error {
	if err := event.Validate(); err != nil {
		return err
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	wirePayload := payload
	if h.signer != nil {
		wirePayload, err = json.Marshal(signedMessage{
			Payload: payload,
			Sig:     h.signer.Sign(payload),
		})
		if err != nil {
			return err
		}
	}
	if h.rdb != nil {
		if err := h.rdb.Publish(ctx, timelineChannel, wirePayload).Err(); err != nil {
			h.enqueue(payload)
			return err
		}
		return nil
	}
	h.enqueue(payload)
	return nil
}

func (h *Hub) enqueue(payload []byte) {
	select {
	case h.broadcast <- payload:
	default:
	}
}

func (h *Hub) subscribeRedis(ctx context.Context) {
	pubsub := h.rdb.Subscribe(ctx, timelineChannel)
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
	h.enqueue(payload)
}

// Client represents a websocket connection.
type Client struct {
	hub   *Hub
	conn  *websocket.Conn
	send  chan []byte
	close func()
}

const (
	writeWait       = 10 * time.Second
	pongWait        = 60 * time.Second
	pingPeriod      = (pongWait * 9) / 10
	maxMessageSize  = 512
	maxPayloadBytes = 1 << 20
)

// NewClient builds a new realtime client.
func NewClient(hub *Hub, conn *websocket.Conn, onClose func()) *Client {
	return &Client{
		hub:   hub,
		conn:  conn,
		send:  make(chan []byte, 16),
		close: onClose,
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
