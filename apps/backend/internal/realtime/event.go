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
	// TargetUserIds restricts delivery to those users' connections. Empty means
	// the event is public and goes to every client.
	//
	// A list rather than one id because a private account's post goes to every
	// follower at once. Sending it as one event per follower meant a JSON
	// marshal, an HMAC signature and a Redis round trip each, so a single post
	// by an account with five thousand followers cost five thousand of all
	// three.
	//
	// This field never reaches a browser. It travels between server instances so
	// each can pick out its own connections, and is stripped before the payload
	// is handed to a client — otherwise batching would show every recipient the
	// whole list, which is the follower list of a private account.
	TargetUserIds []api.UserId `json:"targetUserIds,omitempty"`
}

// targets returns the set of user IDs this event is restricted to, or nil when
// it is public. A nil result means "deliver to everyone", which is not the same
// as an empty set — that would mean "deliver to nobody".
func (e Event) targets() map[string]struct{} {
	if len(e.TargetUserIds) == 0 {
		return nil
	}
	set := make(map[string]struct{}, len(e.TargetUserIds))
	for _, id := range e.TargetUserIds {
		set[id.String()] = struct{}{}
	}
	return set
}

// forClient is the event as a browser should see it: without the recipient list.
func (e Event) forClient() Event {
	e.TargetUserIds = nil
	return e
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
		// A notification is addressed to one person. Without a recipient it
		// would be delivered to everyone connected.
		if len(e.TargetUserIds) == 0 {
			return errors.New("targetUserIds required")
		}
	default:
		return errors.New("invalid event type")
	}
	return nil
}
