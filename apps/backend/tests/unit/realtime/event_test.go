package realtime_test

import (
	"encoding/json"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/realtime"

	"github.com/google/uuid"
)

func TestEventJSON_PostCreated(t *testing.T) {
	postID := api.PostId(uuid.New())
	userID := uuid.New()
	now := time.Unix(1_700_000_000, 0).UTC()
	post := api.Post{
		Id:        postID,
		Content:   "hello",
		CreatedAt: now,
		DeletedAt: nil,
		Media:     []api.Media{},
		Author:    api.User{Id: userID, Username: "alice", CreatedAt: now},
	}
	event := realtime.Event{Type: realtime.EventPostCreated, Post: &post}

	raw := mustMarshalEvent(t, event)
	assertHasKey(t, raw, "type")
	assertHasKey(t, raw, "post")
}

func TestEventJSON_PostDeleted(t *testing.T) {
	postID := api.PostId(uuid.New())
	event := realtime.Event{Type: realtime.EventPostDeleted, PostId: &postID}

	raw := mustMarshalEvent(t, event)
	assertHasKey(t, raw, "type")
	assertHasKey(t, raw, "postId")
}

func TestEventJSON_ReactionUpdated(t *testing.T) {
	postID := api.PostId(uuid.New())
	counts := api.ReactionCounts{
		PostId: postID,
		Reactions: []api.ReactionCount{
			{Emoji: api.Emoji("👍"), Count: 2},
		},
	}
	event := realtime.Event{Type: realtime.EventReactionUpdated, ReactionCounts: &counts}

	raw := mustMarshalEvent(t, event)
	assertHasKey(t, raw, "type")
	assertHasKey(t, raw, "reactionCounts")
}

func mustMarshalEvent(t *testing.T, event realtime.Event) map[string]json.RawMessage {
	t.Helper()
	payload, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(payload, &raw); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return raw
}

func assertHasKey(t *testing.T, raw map[string]json.RawMessage, key string) {
	t.Helper()
	if _, ok := raw[key]; !ok {
		t.Fatalf("expected key %q", key)
	}
}
