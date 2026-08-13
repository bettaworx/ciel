package service

import (
	"context"

	"backend/internal/api"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// Decision is what to do with a post, given who is reading it.
type Decision int

const (
	// Show it as normal.
	Show Decision = iota
	// Cushion means send the post but let the client cover it with a reveal.
	// The viewer chose to hide this account, so the content is theirs to look at
	// again if they want it.
	Cushion
	// Omit means the post does not leave the server.
	Omit
)

// Surface is how the viewer arrived at the list a post is in. It is the whole
// reason this type exists.
//
// The same post, by the same hidden author, is answered differently depending on
// the surface, and getting that wrong is the bug this codebase shipped three
// times: the timeline's Redis path, then post search, then bookmarks all forgot
// to decide at all. Making it an argument means a new list cannot be written
// without saying which kind it is.
type Surface int

const (
	// SurfaceFeed is a list handed to the viewer without them asking for these
	// particular posts: both timelines, search results, bookmarks, notifications.
	// A hidden author's post is dropped outright — the viewer said they did not
	// want to come across this account, and a cushion in a feed is still coming
	// across them.
	SurfaceFeed Surface = iota
	// SurfaceDestination is somewhere the viewer navigated on purpose: a profile,
	// a post's own page, a quoted post, a reply's parent. Dropping here would
	// leave a hole in something they deliberately opened, so it cushions instead.
	SurfaceDestination
)

// ViewerScope is one request's worth of "the world as this viewer sees it".
//
// Built once at the start of a request and passed down. Every visibility
// question after that is answered from these maps rather than from the database,
// which is what lets the guards on replying, boosting, quoting and reacting stop
// being a round trip each.
//
// The zero value is a valid anonymous scope: nothing is hidden, and nothing can
// be interacted with that a logged-out user could not already reach.
type ViewerScope struct {
	// ViewerID is nil for an anonymous request.
	ViewerID *uuid.UUID

	muted     map[uuid.UUID]struct{}
	blocking  map[uuid.UUID]struct{}
	blockedBy map[uuid.UUID]struct{}
}

type viewerScopeKey struct{}

// EnsureViewerScope loads the scope and stashes it on the returned context.
//
// Call it once at the top of a request and pass the context down: every
// LoadViewerScope below it then reuses the one read instead of repeating it.
// Hydration alone would otherwise ask three or four times for the same answer,
// once per attach step and once more per batch of quoted posts.
func EnsureViewerScope(ctx context.Context, store *repository.Store, viewerID *uuid.UUID) (context.Context, ViewerScope, error) {
	scope, err := LoadViewerScope(ctx, store, viewerID)
	if err != nil {
		return ctx, ViewerScope{}, err
	}
	return context.WithValue(ctx, viewerScopeKey{}, scope), scope, nil
}

// cachedViewerScope returns the scope already loaded for this viewer, if the
// context carries one.
//
// The viewer is part of the match on purpose. Notification delivery hydrates
// posts as their recipient rather than as the caller, and handing it the
// caller's scope would filter one person's feed by another person's mutes.
func cachedViewerScope(ctx context.Context, viewerID *uuid.UUID) (ViewerScope, bool) {
	scope, ok := ctx.Value(viewerScopeKey{}).(ViewerScope)
	if !ok {
		return ViewerScope{}, false
	}
	if scope.ViewerID == nil || viewerID == nil {
		return scope, scope.ViewerID == nil && viewerID == nil
	}
	return scope, *scope.ViewerID == *viewerID
}

// LoadViewerScope reads the viewer's moderation relationships, reusing what the
// context already holds for this viewer. An anonymous viewer has none, and is
// not worth a query.
func LoadViewerScope(ctx context.Context, store *repository.Store, viewerID *uuid.UUID) (ViewerScope, error) {
	if cached, ok := cachedViewerScope(ctx, viewerID); ok {
		return cached, nil
	}
	scope := ViewerScope{ViewerID: viewerID}
	if store == nil || viewerID == nil {
		return scope, nil
	}
	rows, err := store.Q.LoadViewerScope(ctx, *viewerID)
	if err != nil {
		return ViewerScope{}, err
	}
	for _, row := range rows {
		switch row.Kind {
		case "muted":
			scope.muted = insertID(scope.muted, row.UserID)
		case "blocking":
			scope.blocking = insertID(scope.blocking, row.UserID)
		case "blocked_by":
			scope.blockedBy = insertID(scope.blockedBy, row.UserID)
		}
	}
	return scope, nil
}

// insertID lazily allocates, so a viewer who has hidden nobody carries no maps.
func insertID(set map[uuid.UUID]struct{}, id uuid.UUID) map[uuid.UUID]struct{} {
	if set == nil {
		set = make(map[uuid.UUID]struct{}, 4)
	}
	set[id] = struct{}{}
	return set
}

// Muted reports whether the viewer muted this account.
func (s ViewerScope) Muted(userID uuid.UUID) bool {
	_, ok := s.muted[userID]
	return ok
}

// Blocking reports whether the viewer blocked this account.
func (s ViewerScope) Blocking(userID uuid.UUID) bool {
	_, ok := s.blocking[userID]
	return ok
}

// BlockedBy reports whether this account blocked the viewer.
func (s ViewerScope) BlockedBy(userID uuid.UUID) bool {
	_, ok := s.blockedBy[userID]
	return ok
}

// Hides reports whether the viewer has hidden this account, by either means.
func (s ViewerScope) Hides(userID uuid.UUID) bool {
	return s.Muted(userID) || s.Blocking(userID)
}

// CanInteractWith reports whether the viewer may reply to, boost, quote or react
// to this account's posts.
//
// Both directions refuse. Being blocked is obvious; blocking someone and then
// replying to them is not a conversation, since they cannot see the reply. Note
// this is deliberately stricter than reading: can_view_user leaves the blocker
// reading so the reveal cushion has something to reveal.
func (s ViewerScope) CanInteractWith(userID uuid.UUID) bool {
	if s.ViewerID != nil && *s.ViewerID == userID {
		return true
	}
	return !s.Blocking(userID) && !s.BlockedBy(userID)
}

// ForAuthor decides what to do with a post written by this account.
func (s ViewerScope) ForAuthor(userID uuid.UUID, surface Surface) Decision {
	if !s.Hides(userID) {
		return Show
	}
	if surface == SurfaceFeed {
		return Omit
	}
	return Cushion
}

// ForPost decides what to do with a whole post, which can be hidden by more than
// its own author.
//
// Collects in one place what used to be spread across the timeline filter, the
// reply filter and the boost check, each of which knew about a different subset
// of the reasons.
func (s ViewerScope) ForPost(post api.Post, surface Surface) Decision {
	if d := s.ForAuthor(post.Author.Id, surface); d != Show {
		return d
	}
	if surface != SurfaceFeed {
		// The rest of the reasons below are all "this row is a fragment of
		// something the viewer cannot follow", which only matters in a feed. On a
		// profile or a post's own page the fragment is the thing they opened.
		return Show
	}
	// A reply whose parent the viewer cannot read. Half of a conversation with an
	// account they hid, or with a private one they do not follow — keeping it
	// would let that account back into the feed through everyone who talks to
	// them.
	if boolValue(post.ParentPrivate) || boolValue(post.ParentHidden) {
		return Omit
	}
	if isPureBoost(post) {
		// A pure boost is nothing but someone else's post, so a hidden author
		// reaches the feed through it under a visible booster's name. Dropped
		// whole rather than cushioned: with no words of its own there would be
		// nothing left in the card.
		if post.Reference != nil && s.Hides(post.Reference.Author.Id) {
			return Omit
		}
		// Boosted a post that has since become unreadable — the author went
		// private, or blocked the viewer. Nothing left to render at all.
		if boolValue(post.ReferenceRestricted) {
			return Omit
		}
	}
	return Show
}

// isPureBoost reports whether this post is a boost with no words of its own.
func isPureBoost(post api.Post) bool {
	return post.Content == "" && post.ReferenceId != nil
}

func boolValue(v *bool) bool {
	return v != nil && *v
}

// StampAuthorFlags marks the posts whose author the viewer has hidden, so the
// client can draw the indicator beside the name and hold the card behind a
// reveal.
//
// Both flags are set when both apply: they are separate decisions with separate
// undo buttons, and collapsing them would make the menu offer "unblock" on an
// account that stays muted afterwards.
func (s ViewerScope) StampAuthorFlags(posts []api.Post) {
	if len(s.muted) == 0 && len(s.blocking) == 0 {
		return
	}
	for i := range posts {
		if s.Muted(posts[i].Author.Id) {
			muted := true
			posts[i].Author.IsMuted = &muted
		}
		if s.Blocking(posts[i].Author.Id) {
			blocking := true
			posts[i].Author.IsBlocking = &blocking
		}
	}
}

// Filter drops the posts this surface should not show, keeping order.
//
// Feeds also filter in SQL, which is what keeps a page's worth of rows honest
// against LIMIT. This runs anyway because a Redis timeline hit never executes
// those queries: it rebuilds its rows from GetPostsByIDs, which deliberately
// carries only the hard visibility gate so a quoted or replied-to post stays
// fetchable for the reveal.
func (s ViewerScope) Filter(posts []api.Post, surface Surface) []api.Post {
	if surface != SurfaceFeed {
		return posts
	}
	kept := make([]api.Post, 0, len(posts))
	for _, post := range posts {
		if s.ForPost(post, surface) == Omit {
			continue
		}
		kept = append(kept, post)
	}
	return kept
}

// BlockedByIDs returns the accounts that blocked the viewer, for passing to a
// query as a uuid[].
//
// Never empty-checked away: an empty array is what makes the predicate a no-op
// for a viewer nobody has blocked, and for an anonymous one.
func (s ViewerScope) BlockedByIDs() []uuid.UUID {
	ids := make([]uuid.UUID, 0, len(s.blockedBy))
	for id := range s.blockedBy {
		ids = append(ids, id)
	}
	return ids
}

// HiddenIDs returns the accounts the viewer has hidden, for passing to a query
// as a uuid[] so the feed predicates can be an array membership test instead of
// a subquery per row.
func (s ViewerScope) HiddenIDs() []uuid.UUID {
	ids := make([]uuid.UUID, 0, len(s.muted)+len(s.blocking))
	for id := range s.muted {
		ids = append(ids, id)
	}
	for id := range s.blocking {
		if _, alsoMuted := s.muted[id]; alsoMuted {
			continue
		}
		ids = append(ids, id)
	}
	return ids
}
