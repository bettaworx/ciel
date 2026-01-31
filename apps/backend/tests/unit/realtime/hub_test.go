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

	client := realtime.NewClient(hub, nil, nil)
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
