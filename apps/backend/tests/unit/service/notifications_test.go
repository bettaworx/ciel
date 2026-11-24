package service

import (
	"testing"

	"backend/internal/api"
	"backend/internal/service"

	"github.com/google/uuid"
)

func TestPostNotifyTargets(t *testing.T) {
	postID := uuid.New()
	actor := uuid.New()
	parentAuthor := uuid.New()
	referenceAuthor := uuid.New()
	mentioned := uuid.New()

	type want struct {
		userID uuid.UUID
		typ    api.NotificationType
	}
	tests := []struct {
		name              string
		parentAuthorID    uuid.UUID
		referenceAuthorID uuid.UUID
		mentionedIDs      []uuid.UUID
		want              []want
	}{
		{
			name: "plain post notifies nobody",
		},
		{
			name:           "reply notifies the parent author",
			parentAuthorID: parentAuthor,
			want:           []want{{parentAuthor, api.Reply}},
		},
		{
			name:              "boost notifies the referenced author",
			referenceAuthorID: referenceAuthor,
			want:              []want{{referenceAuthor, api.Boost}},
		},
		{
			name:         "mentions notify each mentioned user",
			mentionedIDs: []uuid.UUID{mentioned, referenceAuthor},
			want:         []want{{mentioned, api.Mention}, {referenceAuthor, api.Mention}},
		},
		{
			name:           "replying to someone you also mention yields one reply notification",
			parentAuthorID: parentAuthor,
			mentionedIDs:   []uuid.UUID{parentAuthor, mentioned},
			want:           []want{{parentAuthor, api.Reply}, {mentioned, api.Mention}},
		},
		{
			name:              "quoting someone you also mention yields one boost notification",
			referenceAuthorID: referenceAuthor,
			mentionedIDs:      []uuid.UUID{referenceAuthor},
			want:              []want{{referenceAuthor, api.Boost}},
		},
		{
			name:              "self reply, self boost and self mention are all suppressed",
			parentAuthorID:    actor,
			referenceAuthorID: actor,
			mentionedIDs:      []uuid.UUID{actor},
		},
		{
			name:              "reply outranks boost for the same user",
			parentAuthorID:    parentAuthor,
			referenceAuthorID: parentAuthor,
			want:              []want{{parentAuthor, api.Reply}},
		},
		{
			name:         "duplicate mentions collapse",
			mentionedIDs: []uuid.UUID{mentioned, mentioned},
			want:         []want{{mentioned, api.Mention}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := service.PostNotifyTargets(postID, actor, tt.parentAuthorID, tt.referenceAuthorID, tt.mentionedIDs)
			if len(got) != len(tt.want) {
				t.Fatalf("got %d targets, want %d: %+v", len(got), len(tt.want), got)
			}
			for i, w := range tt.want {
				if got[i].UserID != w.userID {
					t.Errorf("target %d: userID = %v, want %v", i, got[i].UserID, w.userID)
				}
				if got[i].Type != w.typ {
					t.Errorf("target %d: type = %v, want %v", i, got[i].Type, w.typ)
				}
				if got[i].ActorID != actor {
					t.Errorf("target %d: actorID = %v, want %v", i, got[i].ActorID, actor)
				}
				if got[i].PostID != postID {
					t.Errorf("target %d: postID = %v, want %v", i, got[i].PostID, postID)
				}
			}
		})
	}
}
