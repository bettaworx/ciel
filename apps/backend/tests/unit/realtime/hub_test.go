package realtime_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/realtime"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestHubPublish_RedisPubSubDelivers(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	defer func() { _ = rdb.Close() }()

	hub := realtime.NewHub(rdb)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	readyCtx, readyCancel := context.WithTimeout(context.Background(), time.Second)
	defer readyCancel()
	if !hub.WaitReady(readyCtx) {
		t.Fatalf("hub subscription not ready")
	}

	client := realtime.NewClient(hub, nil, "", nil)
	hub.Register(client)

	postID := api.PostId(uuid.New())
	event := realtime.Event{Type: realtime.EventPostDeleted, PostId: &postID}
	if err := hub.Publish(ctx, event); err != nil {
		t.Fatalf("publish: %v", err)
	}

	select {
	case payload := <-client.SendChan():
		var got realtime.Event
		if err := json.Unmarshal(payload, &got); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if got.Type != realtime.EventPostDeleted || got.PostId == nil || *got.PostId != postID {
			t.Fatalf("unexpected event: %+v", got)
		}
	case <-time.After(time.Second):
		t.Fatalf("timed out waiting for payload")
	}
}

func TestHubPublish_NotificationOnlyReachesTarget(t *testing.T) {
	hub := realtime.NewHub(nil)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	targetID := uuid.New()
	target := realtime.NewClient(hub, nil, targetID.String(), nil)
	other := realtime.NewClient(hub, nil, uuid.NewString(), nil)
	anonymous := realtime.NewClient(hub, nil, "", nil)
	hub.Register(target)
	hub.Register(other)
	hub.Register(anonymous)

	userID := api.UserId(targetID)
	notification := api.Notification{Id: uuid.New(), Type: api.Reaction, CreatedAt: time.Now()}
	if err := hub.Publish(ctx, realtime.Event{
		Type:         realtime.EventNotificationCreated,
		Notification: &notification,
		TargetUserId: &userID,
	}); err != nil {
		t.Fatalf("publish: %v", err)
	}

	select {
	case payload := <-target.SendChan():
		var got realtime.Event
		if err := json.Unmarshal(payload, &got); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if got.Type != realtime.EventNotificationCreated {
			t.Fatalf("unexpected event type: %v", got.Type)
		}
		if got.Notification == nil || got.Notification.Id != notification.Id {
			t.Fatalf("unexpected notification: %+v", got.Notification)
		}
	case <-time.After(time.Second):
		t.Fatalf("target did not receive the notification")
	}

	for name, c := range map[string]*realtime.Client{"other user": other, "anonymous": anonymous} {
		select {
		case payload := <-c.SendChan():
			t.Fatalf("%s must not receive a targeted notification, got %s", name, payload)
		case <-time.After(100 * time.Millisecond):
		}
	}
}

func TestHubPublish_PublicEventReachesEveryone(t *testing.T) {
	hub := realtime.NewHub(nil)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	authenticated := realtime.NewClient(hub, nil, uuid.NewString(), nil)
	anonymous := realtime.NewClient(hub, nil, "", nil)
	hub.Register(authenticated)
	hub.Register(anonymous)

	postID := api.PostId(uuid.New())
	if err := hub.Publish(ctx, realtime.Event{Type: realtime.EventPostDeleted, PostId: &postID}); err != nil {
		t.Fatalf("publish: %v", err)
	}

	for name, c := range map[string]*realtime.Client{"authenticated": authenticated, "anonymous": anonymous} {
		select {
		case <-c.SendChan():
		case <-time.After(time.Second):
			t.Fatalf("%s did not receive the public event", name)
		}
	}
}
