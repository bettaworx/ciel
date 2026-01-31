package moderation

import (
	"context"
	"database/sql"
	"fmt"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// ReportsService handles report management operations
type ReportsService struct {
	store       *repository.Store
	logsService *LogsService
}

// NewReportsService creates a new ReportsService
func NewReportsService(store *repository.Store, logsService *LogsService) *ReportsService {
	return &ReportsService{
		store:       store,
		logsService: logsService,
	}
}

// CreateReportParams contains parameters for creating a report
type CreateReportParams struct {
	ReporterUserID uuid.UUID
	TargetType     string
	TargetID       uuid.UUID
	Reason         string
	Details        string
}

// CreateReport creates a new report
func (s *ReportsService) CreateReport(ctx context.Context, params CreateReportParams) (sqlc.Report, error) {
	// Prepare nullable parameters
	var details sql.NullString
	if params.Details != "" {
		details = sql.NullString{String: params.Details, Valid: true}
	}

	// Create report
	report, err := s.store.Q.CreateReport(ctx, sqlc.CreateReportParams{
		ReporterUserID: params.ReporterUserID,
		TargetType:     params.TargetType,
		TargetID:       params.TargetID,
		Reason:         params.Reason,
		Details:        details,
	})
	if err != nil {
		return sqlc.Report{}, fmt.Errorf("failed to create report: %w", err)
	}

	return report, nil
}

// GetReport retrieves a report by ID with user information
func (s *ReportsService) GetReport(ctx context.Context, reportID uuid.UUID) (sqlc.GetReportRow, error) {
	report, err := s.store.Q.GetReport(ctx, reportID)
	if err != nil {
		return sqlc.GetReportRow{}, fmt.Errorf("failed to get report: %w", err)
	}

	return report, nil
}

// ListReportsParams contains parameters for listing reports
type ListReportsParams struct {
	Status     *string
	TargetType *string
	Limit      int32
	Offset     int32
}

// ListReportsResult contains reports with pagination info
type ListReportsResult struct {
	Reports []sqlc.ListReportsRow
	Total   int64
}

// ListReports returns a paginated list of reports with filtering
func (s *ReportsService) ListReports(ctx context.Context, params ListReportsParams) (ListReportsResult, error) {
	// Prepare nullable parameters
	var status sql.NullString
	if params.Status != nil {
		status = sql.NullString{String: *params.Status, Valid: true}
	}

	var targetType sql.NullString
	if params.TargetType != nil {
		targetType = sql.NullString{String: *params.TargetType, Valid: true}
	}

	// Get reports
	reports, err := s.store.Q.ListReports(ctx, sqlc.ListReportsParams{
		Status:     status,
		TargetType: targetType,
		Limit:      params.Limit,
		Offset:     params.Offset,
	})
	if err != nil {
		return ListReportsResult{}, fmt.Errorf("failed to list reports: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountReports(ctx, sqlc.CountReportsParams{
		Status:     status,
		TargetType: targetType,
	})
	if err != nil {
		return ListReportsResult{}, fmt.Errorf("failed to count reports: %w", err)
	}

	return ListReportsResult{
		Reports: reports,
		Total:   total,
	}, nil
}

// UpdateReportStatusParams contains parameters for updating report status
type UpdateReportStatusParams struct {
	ReportID   uuid.UUID
	Status     string
	ReviewedBy uuid.UUID
	Resolution string
}

// UpdateReportStatus updates the status and resolution of a report
func (s *ReportsService) UpdateReportStatus(ctx context.Context, params UpdateReportStatusParams) (sqlc.Report, error) {
	// Prepare nullable parameters
	var resolution sql.NullString
	if params.Resolution != "" {
		resolution = sql.NullString{String: params.Resolution, Valid: true}
	}

	// Update report
	report, err := s.store.Q.UpdateReportStatus(ctx, sqlc.UpdateReportStatusParams{
		ID:         params.ReportID,
		Status:     params.Status,
		ReviewedBy: uuid.NullUUID{UUID: params.ReviewedBy, Valid: true},
		Resolution: resolution,
	})
	if err != nil {
		return sqlc.Report{}, fmt.Errorf("failed to update report status: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: params.ReviewedBy,
		Action:      "update_report_status",
		TargetType:  "report",
		TargetID:    params.ReportID.String(),
		Details:     fmt.Sprintf("status=%s resolution=%s", params.Status, params.Resolution),
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log report status update: %v\n", err)
	}

	return report, nil
}
