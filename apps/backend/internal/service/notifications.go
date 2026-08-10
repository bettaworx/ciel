package service

import (
	"context"
	"database/sql"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/db/sqlc"
	"backend/internal/realtime"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// CreatedNotification identifies a notification row that was actually written,
// so the caller can publish it after its transaction commits.
type CreatedNotification struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

// NotifyParams describes a single notification to deliver.
//
// Adding a notification kind means adding a value to api.NotificationType in
// packages/api/schemas/enums.yml and calling Notify from wherever it fires.
type NotifyParams struct {
	// UserID is the recipient.
	UserID uuid.UUID
	Type   api.NotificationType
	// ActorID is the user who triggered it. Zero for system notifications.
	ActorID uuid.UUID
	// PostID is the post the notification is about, if any.
	PostID uuid.UUID
	// Subtype discriminates within a type (the emoji, for reactions).
	Subtype string
}

// Notify records a notification inside an existing transaction. The returned ID
// is uuid.Nil when nothing was written (self-notification or a repeat caught by
// idx_notifications_dedupe).
//
// It takes *sqlc.Queries rather than a service so callers can keep it in the
// same transaction as the action that triggered it.
func Notify(ctx context.Context, q *sqlc.Queries, p NotifyParams) (uuid.UUID, error) {
	if p.UserID == uuid.Nil || p.UserID == p.ActorID {
		return uuid.Nil, nil
	}
	rows, err := q.InsertNotification(ctx, sqlc.InsertNotificationParams{
		UserID:      p.UserID,
		Type:        string(p.Type),
		ActorUserID: uuid.NullUUID{UUID: p.ActorID, Valid: p.ActorID != uuid.Nil},
		PostID:      uuid.NullUUID{UUID: p.PostID, Valid: p.PostID != uuid.Nil},
		Subtype:     p.Subtype,
	})
	if err != nil {
		return uuid.Nil, err
	}
	if len(rows) == 0 {
		// Deduped by the unique index.
		return uuid.Nil, nil
	}
	return rows[0].ID, nil
}

// Unnotify removes a notification because the action it described was undone.
//
// Without this, idx_notifications_dedupe would suppress the notification
// forever: re-doing the same action would conflict with the stale row and the
// recipient would never hear about it.
func Unnotify(ctx context.Context, q *sqlc.Queries, p NotifyParams) error {
	if p.UserID == uuid.Nil || p.UserID == p.ActorID {
		return nil
	}
	return q.DeleteNotification(ctx, sqlc.DeleteNotificationParams{
		UserID:      p.UserID,
		Type:        string(p.Type),
		ActorUserID: uuid.NullUUID{UUID: p.ActorID, Valid: p.ActorID != uuid.Nil},
		PostID:      uuid.NullUUID{UUID: p.PostID, Valid: p.PostID != uuid.Nil},
		Subtype:     p.Subtype,
	})
}

// PostNotifyTargets resolves who gets notified about a newly created post.
//
// A recipient gets at most one notification even when several relationships
// apply (replying to someone while also @-mentioning them), with priority
// reply > boost > mention. The actor never notifies themselves.
func PostNotifyTargets(postID, actorID, parentAuthorID, referenceAuthorID uuid.UUID, mentionedIDs []uuid.UUID) []NotifyParams {
	targets := make([]NotifyParams, 0, 1+len(mentionedIDs))
	seen := make(map[uuid.UUID]struct{}, 1+len(mentionedIDs))
	add := func(userID uuid.UUID, typ api.NotificationType) {
		if userID == uuid.Nil || userID == actorID {
			return
		}
		if _, ok := seen[userID]; ok {
			return
		}
		seen[userID] = struct{}{}
		targets = append(targets, NotifyParams{
			UserID:  userID,
			Type:    typ,
			ActorID: actorID,
			PostID:  postID,
		})
	}
	add(parentAuthorID, api.Reply)
	add(referenceAuthorID, api.Boost)
	for _, id := range mentionedIDs {
		add(id, api.Mention)
	}
	return targets
}

type NotificationsService struct {
	store *repository.Store
	posts *PostsService
}

func NewNotificationsService(store *repository.Store) *NotificationsService {
	return &NotificationsService{store: store}
}

// SetPostsService injects the posts service used to hydrate embedded posts.
// Set after construction because PostsService is built first in main.go.
func (s *NotificationsService) SetPostsService(posts *PostsService) {
	s.posts = posts
}

func (s *NotificationsService) List(ctx context.Context, userID api.UserId, params api.GetNotificationsParams) (api.NotificationsPage, error) {
	if s.store == nil {
		return api.NotificationsPage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	limit := 30
	if params.Limit != nil {
		limit = *params.Limit
	}
	if limit < 1 || limit > 100 {
		return api.NotificationsPage{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}

	cursor, err := decodeCursor(params.Cursor)
	if err != nil {
		return api.NotificationsPage{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}

	var cTime sql.NullTime
	var cID uuid.NullUUID
	if cursor != nil {
		cTime = sql.NullTime{Time: time.UnixMilli(cursor.Score).UTC(), Valid: true}
		if uid, perr := uuid.Parse(cursor.ID); perr == nil {
			cID = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}

	var unreadOnly sql.NullBool
	if params.UnreadOnly != nil && *params.UnreadOnly {
		unreadOnly = sql.NullBool{Bool: true, Valid: true}
	}

	// nil means "no filter"; an explicitly empty list matches nothing.
	var types []string
	if params.Type != nil {
		types = make([]string, 0, len(*params.Type))
		for _, t := range *params.Type {
			if !t.Valid() {
				return api.NotificationsPage{}, NewError(http.StatusBadRequest, "invalid_request", "unknown notification type")
			}
			types = append(types, string(t))
		}
	}

	rows, err := s.store.Q.ListNotifications(ctx, sqlc.ListNotificationsParams{
		UserID:     userID,
		UnreadOnly: unreadOnly,
		Types:      types,
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(limit),
	})
	if err != nil {
		return api.NotificationsPage{}, err
	}

	items := make([]api.Notification, 0, len(rows))
	postIDs := make([]uuid.UUID, 0, len(rows))
	seenPost := make(map[uuid.UUID]struct{}, len(rows))
	for _, row := range rows {
		items = append(items, mapNotificationRow(row))
		if row.PostID.Valid {
			if _, ok := seenPost[row.PostID.UUID]; !ok {
				seenPost[row.PostID.UUID] = struct{}{}
				postIDs = append(postIDs, row.PostID.UUID)
			}
		}
	}

	// Batch-hydrate the referenced posts so the list costs one extra round of
	// queries regardless of page size.
	if len(postIDs) > 0 && s.posts != nil {
		byID, err := s.posts.GetHydratedPostsByIDs(ctx, postIDs, &userID)
		if err != nil {
			return api.NotificationsPage{}, err
		}
		for i, row := range rows {
			if !row.PostID.Valid {
				continue
			}
			if post, ok := byID[row.PostID.UUID]; ok {
				p := post
				items[i].Post = &p
			}
		}
	}

	var nextCursor *string
	if len(rows) == limit {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.CreatedAt.UnixMilli(), ID: last.ID.String()})
		nextCursor = &n
	}
	return api.NotificationsPage{Items: items, NextCursor: nextCursor}, nil
}

func (s *NotificationsService) UnreadCount(ctx context.Context, userID api.UserId) (api.UnreadCount, error) {
	if s.store == nil {
		return api.UnreadCount{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	count, err := s.store.Q.CountUnreadNotifications(ctx, userID)
	if err != nil {
		return api.UnreadCount{}, err
	}
	return api.UnreadCount{Count: int(count)}, nil
}

// MaxMarkReadIDs caps how many notification IDs a single mark-read call accepts.
const MaxMarkReadIDs = 200

// MarkRead marks the given notifications read, or every unread one when ids is
// nil. Returns the remaining unread count.
func (s *NotificationsService) MarkRead(ctx context.Context, userID api.UserId, ids *[]uuid.UUID) (api.UnreadCount, error) {
	if s.store == nil {
		return api.UnreadCount{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	var list []uuid.UUID
	if ids != nil {
		if len(*ids) > MaxMarkReadIDs {
			return api.UnreadCount{}, NewError(http.StatusBadRequest, "invalid_request", "too many ids")
		}
		// A non-nil but empty slice must not be treated as "mark everything".
		list = *ids
		if list == nil {
			list = []uuid.UUID{}
		}
	}
	// The query scopes the update to user_id, so a caller cannot mark someone
	// else's notifications read by guessing IDs.
	if err := s.store.Q.MarkNotificationsRead(ctx, sqlc.MarkNotificationsReadParams{
		UserID: userID,
		Ids:    list,
	}); err != nil {
		return api.UnreadCount{}, err
	}
	return s.UnreadCount(ctx, userID)
}

// Publish delivers freshly created notifications to their recipients' realtime
// connections. Best effort: the triggering request has already committed, so a
// failure here is logged by the publisher and otherwise ignored.
func (s *NotificationsService) Publish(ctx context.Context, publisher realtime.Publisher, created []CreatedNotification) {
	if s == nil || s.store == nil || publisher == nil {
		return
	}
	for _, c := range created {
		n := s.build(ctx, c)
		if n == nil {
			continue
		}
		target := api.UserId(c.UserID)
		_ = publisher.Publish(ctx, realtime.Event{
			Type:         realtime.EventNotificationCreated,
			Notification: n,
			TargetUserId: &target,
		})
	}
}

// build loads a notification and hydrates it for delivery to its recipient.
// Returns nil when the notification no longer exists.
func (s *NotificationsService) build(ctx context.Context, c CreatedNotification) *api.Notification {
	if c.ID == uuid.Nil {
		return nil
	}
	row, err := s.store.Q.GetNotificationByID(ctx, c.ID)
	if err != nil {
		return nil
	}
	n := mapNotificationRow(sqlc.ListNotificationsRow(row))
	if row.PostID.Valid && s.posts != nil {
		userID := api.UserId(c.UserID)
		if byID, err := s.posts.GetHydratedPostsByIDs(ctx, []uuid.UUID{row.PostID.UUID}, &userID); err == nil {
			if post, ok := byID[row.PostID.UUID]; ok {
				n.Post = &post
			}
		}
	}
	return &n
}

func mapNotificationRow(row sqlc.ListNotificationsRow) api.Notification {
	n := api.Notification{
		Id:        row.ID,
		Type:      api.NotificationType(row.Type),
		CreatedAt: row.CreatedAt,
	}
	if row.ReadAt.Valid {
		t := row.ReadAt.Time
		n.ReadAt = &t
	}
	if row.Subtype != "" {
		emoji := api.Emoji(row.Subtype)
		n.Emoji = &emoji
	}
	if row.ActorID.Valid {
		actor := api.MentionUser{
			Id:       row.ActorID.UUID,
			Username: row.ActorUsername.String,
		}
		if row.ActorDisplayName.Valid {
			if v := strings.TrimSpace(row.ActorDisplayName.String); v != "" {
				actor.DisplayName = &v
			}
		}
		if row.ActorAvatarMediaID.Valid {
			ext := ""
			if row.ActorAvatarExt.Valid {
				ext = row.ActorAvatarExt.String
			}
			url := mediaImageURL(row.ActorAvatarMediaID.UUID, ext)
			actor.AvatarUrl = &url
		}
		n.Actor = &actor
	}
	return n
}
