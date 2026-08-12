package realtime

import (
	"errors"

	"backend/internal/api"
)

// EventType identifies the kind of realtime update.
type EventType string

const (
	EventPostCreated         EventType = "post_created"
	EventPostDeleted         EventType = "post_deleted"
	EventReactionUpdated     EventType = "reaction_updated"
	EventUserRegistered      EventType = "user_registered"
	EventUserDeleted         EventType = "user_deleted"
	EventUserPrivacyChanged  EventType = "user_privacy_changed"
	EventServerInfoUpdated   EventType = "server_info_updated"
	EventServerConfigUpdated EventType = "server_config_updated"
	EventNotificationCreated EventType = "notification_created"
)

// Event is the payload delivered over realtime channels.
type Event struct {
	Type           EventType           `json:"type"`
	Post           *api.Post           `json:"post,omitempty"`
	PostId         *api.PostId         `json:"postId,omitempty"`
	ReactionCounts *api.ReactionCounts `json:"reactionCounts,omitempty"`
	ServerInfo     *api.ServerInfo     `json:"serverInfo,omitempty"`
	ServerConfig   *api.ServerConfig   `json:"serverConfig,omitempty"`
	Notification   *api.Notification   `json:"notification,omitempty"`
	// Username identifies the subject of a user-level event.
	Username *string `json:"username,omitempty"`
	// TargetUserId restricts delivery to that user's connections. Empty means
	// the event is public and goes to every client.
	TargetUserId *api.UserId `json:"targetUserId,omitempty"`
}

// target returns the user ID this event is restricted to, or "" when public.
func (e Event) target() string {
	if e.TargetUserId == nil {
		return ""
	}
	return e.TargetUserId.String()
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
	case EventUserRegistered, EventUserDeleted:
		// No required payload fields
	case EventUserPrivacyChanged:
		if e.Username == nil {
			return errors.New("username required")
		}
	case EventServerInfoUpdated:
		if e.ServerInfo == nil {
			return errors.New("serverInfo required")
		}
	case EventServerConfigUpdated:
		if e.ServerConfig == nil {
			return errors.New("serverConfig required")
		}
	case EventNotificationCreated:
		if e.Notification == nil {
			return errors.New("notification required")
		}
		if e.TargetUserId == nil {
			return errors.New("targetUserId required")
		}
	default:
		return errors.New("invalid event type")
	}
	return nil
}
