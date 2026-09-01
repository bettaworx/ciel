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
	// The grouped query compares ids as text, since Postgres has no max(uuid).
	var cID sql.NullString
	if cursor != nil {
		cTime = sql.NullTime{Time: time.UnixMilli(cursor.Score).UTC(), Valid: true}
		if uid, perr := uuid.Parse(cursor.ID); perr == nil {
			cID = sql.NullString{String: uid.String(), Valid: true}
		}
	}

	var unreadOnly sql.NullBool
	if params.UnreadOnly != nil && *params.UnreadOnly {
		unreadOnly = sql.NullBool{Bool: true, Valid: true}
	}

	// The zone the day boundary between groups is drawn in. Validated here so an
	// unknown name is a 400 rather than a failed query.
	tz := "UTC"
	if params.Tz != nil && *params.Tz != "" {
		tz = *params.Tz
		if _, err := time.LoadLocation(tz); err != nil {
			return api.NotificationsPage{}, NewError(http.StatusBadRequest, "invalid_request", "unknown time zone")
		}
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

	rows, err := s.store.Q.ListNotificationGroups(ctx, sqlc.ListNotificationGroupsParams{
		Tz:         tz,
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
	// Targets of rows that actually collapsed several notifications together.
	groupedTargets := make([]uuid.UUID, 0)
	seenTarget := make(map[uuid.UUID]struct{})
	for _, row := range rows {
		items = append(items, mapNotificationGroupRow(row))
		if row.PostID != uuid.Nil {
			if _, ok := seenPost[row.PostID]; !ok {
				seenPost[row.PostID] = struct{}{}
				postIDs = append(postIDs, row.PostID)
			}
		}
		// The nil target is not "no group": follows carry no post, so every
		// follow of this user groups under it.
		if row.GroupCount > 1 {
			if _, ok := seenTarget[row.GroupTarget]; !ok {
				seenTarget[row.GroupTarget] = struct{}{}
				groupedTargets = append(groupedTargets, row.GroupTarget)
			}
		}
	}

	// Only pages that actually contain a group pay for the member lookup.
	if len(groupedTargets) > 0 {
		if err := s.attachGroupMembers(ctx, userID, tz, rows, items, groupedTargets); err != nil {
			return api.NotificationsPage{}, err
		}
	}

	// Fill in the single-actor rows, and any group whose members query found
	// nothing, from the row's own actor.
	actorIDs := make([]uuid.UUID, 0, len(rows))
	for i, row := range rows {
		if items[i].Actor == nil && row.ActorID != uuid.Nil {
			actorIDs = append(actorIDs, row.ActorID)
		}
	}
	if len(actorIDs) > 0 {
		byID, err := s.userSummaries(ctx, actorIDs)
		if err != nil {
			return api.NotificationsPage{}, err
		}
		for i, row := range rows {
			if items[i].Actor != nil || row.ActorID == uuid.Nil {
				continue
			}
			if user, ok := byID[row.ActorID]; ok {
				u := user
				items[i].Actor = &u
				items[i].Actors = &[]api.NotificationActor{
					{User: u, Emoji: emojiOrNil(row.Subtype)},
				}
			}
		}
	}

	// Batch-hydrate the referenced posts so the list costs one extra round of
	// queries regardless of page size.
	if len(postIDs) > 0 && s.posts != nil {
		// SurfaceFeed: a notification list is handed to the recipient whole. The
		// rows themselves are already filtered by actor, so this catches the
		// embedded post rather than the notification.
		byID, err := s.posts.GetHydratedPostsByIDs(ctx, postIDs, &userID, SurfaceFeed)
		if err != nil {
			return api.NotificationsPage{}, err
		}
		for i, row := range rows {
			if row.PostID == uuid.Nil {
				continue
			}
			if post, ok := byID[row.PostID]; ok {
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
		_ = publisher.Publish(ctx, realtime.Event{
			Type:          realtime.EventNotificationCreated,
			Notification:  n,
			TargetUserIds: []api.UserId{api.UserId(c.UserID)},
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
	n := mapNotificationRow(row)
	if row.PostID.Valid && s.posts != nil {
		userID := api.UserId(c.UserID)
		if byID, err := s.posts.GetHydratedPostsByIDs(ctx, []uuid.UUID{row.PostID.UUID}, &userID, SurfaceFeed); err == nil {
			if post, ok := byID[row.PostID.UUID]; ok {
				n.Post = &post
			}
		}
	}
	return &n
}

// MaxGroupedActors caps how many avatars a grouped row carries. The row lays
// them out side by side and shows roughly this many at full width.
const MaxGroupedActors = 8

// attachGroupMembers fills the grouped rows with their newest actors and the
// ids they cover, in one query for the whole page.
func (s *NotificationsService) attachGroupMembers(
	ctx context.Context,
	userID api.UserId,
	tz string,
	rows []sqlc.ListNotificationGroupsRow,
	items []api.Notification,
	targets []uuid.UUID,
) error {
	members, err := s.store.Q.ListNotificationGroupMembers(ctx, sqlc.ListNotificationGroupMembersParams{
		Tz:           tz,
		UserID:       userID,
		GroupTargets: targets,
	})
	if err != nil {
		return err
	}

	// The query returns every groupable notification for these targets, on every
	// day, so bucket by the same key the grouping used — emoji is deliberately
	// not part of it. Members arrive newest first.
	type groupKey struct {
		typ    string
		target uuid.UUID
		// A date, held as text: time.Time carries a Location and would not
		// compare equal as a map key across the two queries.
		day string
	}
	byKey := make(map[groupKey][]sqlc.ListNotificationGroupMembersRow, len(targets))
	actorIDs := make([]uuid.UUID, 0, len(members))
	for _, m := range members {
		k := groupKey{typ: m.Type, target: m.GroupTarget, day: m.GroupDay.Format(time.DateOnly)}
		byKey[k] = append(byKey[k], m)
		if m.ActorUserID.Valid {
			actorIDs = append(actorIDs, m.ActorUserID.UUID)
		}
	}
	if len(actorIDs) == 0 {
		return nil
	}
	summaries, err := s.userSummaries(ctx, actorIDs)
	if err != nil {
		return err
	}

	for i, row := range rows {
		if row.GroupCount <= 1 {
			continue
		}
		group := byKey[groupKey{typ: row.Type, target: row.GroupTarget, day: row.GroupDay.Format(time.DateOnly)}]
		if len(group) == 0 {
			continue
		}

		ids := make([]uuid.UUID, 0, len(group))
		actors := make([]api.NotificationActor, 0, MaxGroupedActors)
		for _, m := range group {
			ids = append(ids, m.ID)
			if len(actors) >= MaxGroupedActors || !m.ActorUserID.Valid {
				continue
			}
			if user, ok := summaries[m.ActorUserID.UUID]; ok {
				// One entry per reaction, so the same person can appear twice.
				actors = append(actors, api.NotificationActor{
					User:  user,
					Emoji: emojiOrNil(m.Subtype),
				})
			}
		}
		items[i].NotificationIds = &ids
		if len(actors) > 0 {
			head := actors[0].User
			items[i].Actor = &head
			items[i].Actors = &actors
		}
	}
	return nil
}

// emojiOrNil turns a notification subtype into the actor's emoji. Only reactions
// carry one; every other kind stores an empty subtype.
func emojiOrNil(subtype string) *api.Emoji {
	if subtype == "" {
		return nil
	}
	emoji := api.Emoji(subtype)
	return &emoji
}

// userSummaries loads the lightweight user representation used for actors.
func (s *NotificationsService) userSummaries(
	ctx context.Context,
	ids []uuid.UUID,
) (map[uuid.UUID]api.MentionUser, error) {
	rows, err := s.store.Q.ListUserSummariesByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]api.MentionUser, len(rows))
	for _, row := range rows {
		user := api.MentionUser{Id: row.ID, Username: row.Username}
		if row.DisplayName.Valid {
			if v := strings.TrimSpace(row.DisplayName.String); v != "" {
				user.DisplayName = &v
			}
		}
		if row.AvatarMediaID.Valid {
			ext := ""
			if row.AvatarExt.Valid {
				ext = row.AvatarExt.String
			}
			url := mediaImageURL(row.AvatarMediaID.UUID, ext)
			user.AvatarUrl = &url
		}
		out[row.ID] = user
	}
	return out, nil
}

// mapNotificationGroupRow maps a grouped row. Actors are filled in afterwards,
// since they need a second query.
func mapNotificationGroupRow(row sqlc.ListNotificationGroupsRow) api.Notification {
	count := int(row.GroupCount)
	actorCount := int(row.ActorCount)
	n := api.Notification{
		Id:         row.ID,
		Type:       api.NotificationType(row.Type),
		CreatedAt:  row.CreatedAt,
		Count:      &count,
		ActorCount: &actorCount,
		// Overwritten for real groups; a group of one covers only itself.
		NotificationIds: &[]uuid.UUID{row.ID},
	}
	// A group counts as read only once every member is.
	if !row.GroupUnread {
		t := row.CreatedAt
		n.ReadAt = &t
	}
	if row.Subtype != "" {
		emoji := api.Emoji(row.Subtype)
		n.Emoji = &emoji
	}
	return n
}

// mapNotificationRow maps a single notification, as pushed over realtime.
// Always a group of one: a live event describes one action by one actor.
func mapNotificationRow(row sqlc.GetNotificationByIDRow) api.Notification {
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
