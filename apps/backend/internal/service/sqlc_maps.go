package service

import (
	"database/sql"
	"time"

	"backend/internal/api"
	"backend/internal/db/sqlc"

	"github.com/google/uuid"
)

func nullUUIDToPostIDPtr(v uuid.NullUUID) *api.PostId {
	if !v.Valid {
		return nil
	}
	id := api.PostId(v.UUID)
	return &id
}

func mapPostRow(row sqlc.GetPostWithAuthorByIDRow) api.Post {
	var deletedAt *time.Time
	if row.DeletedAt.Valid {
		t := row.DeletedAt.Time
		deletedAt = &t
	}
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		ParentPrivate: &row.ParentPrivate,
		CreatedAt:   row.CreatedAt,
		DeletedAt:   deletedAt,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}

func mapPostsByUsernameRow(row sqlc.ListPostsByUsernameRow) api.Post {
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		ParentPrivate: &row.ParentPrivate,
		CreatedAt:   row.CreatedAt,
		DeletedAt:   nil,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}

func mapRepliesRow(row sqlc.ListRepliesByParentIDRow) api.Post {
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		CreatedAt:   row.CreatedAt,
		DeletedAt:   nil,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}

func mapThreadChildrenRow(row sqlc.ListThreadChildrenPageRow) api.Post {
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		CreatedAt:   row.CreatedAt,
		DeletedAt:   nil,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}

// MapPostRow maps a sqlc row to API Post.
//
// This is primarily used by tests living outside this package.
func MapPostRow(row sqlc.GetPostWithAuthorByIDRow) api.Post { return mapPostRow(row) }
