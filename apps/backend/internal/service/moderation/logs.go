package moderation

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// LogsService handles moderation logging operations
type LogsService struct {
	store *repository.Store
}

// NewLogsService creates a new LogsService
func NewLogsService(store *repository.Store) *LogsService {
	return &LogsService{
		store: store,
	}
}

// CreateLogParams contains parameters for creating a moderation log
type CreateLogParams struct {
	AdminUserID uuid.UUID
	Action      string
	TargetType  string
	TargetID    string
	Details     string
}

// CreateLog creates a new moderation log entry
func (s *LogsService) CreateLog(ctx context.Context, params CreateLogParams) (sqlc.ModerationLog, error) {
	// Convert details string to JSON
	var details json.RawMessage
	if params.Details != "" {
		// Wrap the details string in JSON
		detailsBytes, err := json.Marshal(params.Details)
		if err != nil {
			return sqlc.ModerationLog{}, fmt.Errorf("failed to marshal details: %w", err)
		}
		details = detailsBytes
	}

	log, err := s.store.Q.CreateModerationLog(ctx, sqlc.CreateModerationLogParams{
		AdminUserID: params.AdminUserID,
		Action:      params.Action,
		TargetType:  params.TargetType,
		TargetID:    params.TargetID,
		Details:     details,
	})
	if err != nil {
		return sqlc.ModerationLog{}, fmt.Errorf("failed to create moderation log: %w", err)
	}

	return log, nil
}

// ListLogsParams contains parameters for listing moderation logs
type ListLogsParams struct {
	AdminUserID *uuid.UUID
	Action      *string
	TargetType  *string
	TargetID    *string
	Limit       int32
	Offset      int32
}

// ListLogsResult contains moderation logs with admin information
type ListLogsResult struct {
	Logs  []sqlc.ListModerationLogsRow
	Total int64
}

// ListLogs returns a paginated list of moderation logs with filtering
func (s *LogsService) ListLogs(ctx context.Context, params ListLogsParams) (ListLogsResult, error) {
	// Prepare nullable parameters
	var adminUserID uuid.NullUUID
	if params.AdminUserID != nil {
		adminUserID = uuid.NullUUID{UUID: *params.AdminUserID, Valid: true}
	}

	var action sql.NullString
	if params.Action != nil {
		action = sql.NullString{String: *params.Action, Valid: true}
	}

	var targetType sql.NullString
	if params.TargetType != nil {
		targetType = sql.NullString{String: *params.TargetType, Valid: true}
	}

	var targetID sql.NullString
	if params.TargetID != nil {
		targetID = sql.NullString{String: *params.TargetID, Valid: true}
	}

	// Get logs
	logs, err := s.store.Q.ListModerationLogs(ctx, sqlc.ListModerationLogsParams{
		AdminUserID: adminUserID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Limit:       params.Limit,
		Offset:      params.Offset,
	})
	if err != nil {
		return ListLogsResult{}, fmt.Errorf("failed to list moderation logs: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountModerationLogs(ctx, sqlc.CountModerationLogsParams{
		AdminUserID: adminUserID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
	})
	if err != nil {
		return ListLogsResult{}, fmt.Errorf("failed to count moderation logs: %w", err)
	}

	return ListLogsResult{
		Logs:  logs,
		Total: total,
	}, nil
}

// GetUserLogs returns moderation logs for a specific user
func (s *LogsService) GetUserLogs(ctx context.Context, userID string, limit, offset int32) ([]sqlc.GetUserModerationLogsRow, error) {
	logs, err := s.store.Q.GetUserModerationLogs(ctx, sqlc.GetUserModerationLogsParams{
		TargetID: userID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get user moderation logs: %w", err)
	}

	return logs, nil
}
