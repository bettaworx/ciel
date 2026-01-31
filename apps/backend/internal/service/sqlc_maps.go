package service

import (
	"database/sql"
	"time"

	"backend/internal/api"
	"backend/internal/db/sqlc"
)

func mapPostRow(row sqlc.GetPostWithAuthorByIDRow) api.Post {
	var deletedAt *time.Time
	if row.DeletedAt.Valid {
		t := row.DeletedAt.Time
		deletedAt = &t
	}
	return api.Post{
		Id:        row.ID,
		Content:   row.Content,
		Media:     []api.Media{},
		CreatedAt: row.CreatedAt,
		DeletedAt: deletedAt,
		// Note: Post author doesn't include agreement fields (not needed for display)
		Author: mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, 0, 0, sql.NullTime{}, sql.NullTime{}),
	}
}

func mapPostsByUsernameRow(row sqlc.ListPostsByUsernameRow) api.Post {
	return api.Post{
		Id:        row.ID,
		Content:   row.Content,
		Media:     []api.Media{},
		CreatedAt: row.CreatedAt,
		DeletedAt: nil,
		// Note: Post author doesn't include agreement fields (not needed for display)
		Author: mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, 0, 0, sql.NullTime{}, sql.NullTime{}),
	}
}

// MapPostRow maps a sqlc row to API Post.
//
// This is primarily used by tests living outside this package.
func MapPostRow(row sqlc.GetPostWithAuthorByIDRow) api.Post { return mapPostRow(row) }
