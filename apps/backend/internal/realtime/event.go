package realtime

import (
	"errors"

	"backend/internal/api"
)

// EventType identifies the kind of realtime update.
type EventType string

const (
	EventPostCreated     EventType = "post_created"
	EventPostDeleted     EventType = "post_deleted"
	EventReactionUpdated EventType = "reaction_updated"
)

// Event is the payload delivered over realtime channels.
type Event struct {
	Type           EventType           `json:"type"`
	Post           *api.Post           `json:"post,omitempty"`
	PostId         *api.PostId         `json:"postId,omitempty"`
	ReactionCounts *api.ReactionCounts `json:"reactionCounts,omitempty"`
}

// Validate ensures required fields for each event type.
func (e Event) Validate() error {
	switch e.Type {
	case EventPostCreated:
		if e.Post == nil {
			return errors.New("post required")
		}
	case EventPostDeleted:
		if e.PostId == nil {
			return errors.New("postId required")
		}
	case EventReactionUpdated:
		if e.ReactionCounts == nil {
			return errors.New("reactionCounts required")
		}
	default:
		return errors.New("invalid event type")
	}
	return nil
}
