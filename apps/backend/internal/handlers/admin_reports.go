package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/service/moderation"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// convertReportToAPI converts a database report row to API report
func convertReportToAPI(report sqlc.GetReportRow) api.Report {
	var details *string
	if report.Details.Valid {
		details = &report.Details.String
	}

	var reviewedBy *openapi_types.UUID
	if report.ReviewedBy.Valid {
		uid := openapi_types.UUID(report.ReviewedBy.UUID)
		reviewedBy = &uid
	}

	var reviewedAt *time.Time
	if report.ReviewedAt.Valid {
		t := report.ReviewedAt.Time
		reviewedAt = &t
	}

	var resolution *string
	if report.Resolution.Valid {
		resolution = &report.Resolution.String
	}

	var reporterDisplayName *string
	if report.ReporterDisplayName.Valid {
		reporterDisplayName = &report.ReporterDisplayName.String
	}

	var reviewerUsername *string
	if report.ReviewerUsername.Valid {
		reviewerUsername = &report.ReviewerUsername.String
	}

	var reviewerDisplayName *string
	if report.ReviewerDisplayName.Valid {
		reviewerDisplayName = &report.ReviewerDisplayName.String
	}

	return api.Report{
		Id:                  openapi_types.UUID(report.ID),
		ReporterUserId:      openapi_types.UUID(report.ReporterUserID),
		ReporterUsername:    &report.ReporterUsername,
		ReporterDisplayName: reporterDisplayName,
		TargetType:          api.ReportTargetType(report.TargetType),
		TargetId:            report.TargetID.String(),
		Reason:              report.Reason,
		Details:             details,
		Status:              api.ReportStatus(report.Status),
		ReviewedBy:          reviewedBy,
		ReviewedAt:          reviewedAt,
		ReviewerUsername:    reviewerUsername,
		ReviewerDisplayName: reviewerDisplayName,
		Resolution:          resolution,
		CreatedAt:           report.CreatedAt,
	}
}

// convertListReportToAPI converts a list report row to API report
func convertListReportToAPI(report sqlc.ListReportsRow) api.Report {
	var details *string
	if report.Details.Valid {
		details = &report.Details.String
	}

	var reviewedBy *openapi_types.UUID
	if report.ReviewedBy.Valid {
		uid := openapi_types.UUID(report.ReviewedBy.UUID)
		reviewedBy = &uid
	}

	var reviewedAt *time.Time
	if report.ReviewedAt.Valid {
		t := report.ReviewedAt.Time
		reviewedAt = &t
	}

	var resolution *string
	if report.Resolution.Valid {
		resolution = &report.Resolution.String
	}

	var reporterDisplayName *string
	if report.ReporterDisplayName.Valid {
		reporterDisplayName = &report.ReporterDisplayName.String
	}

	return api.Report{
		Id:                  openapi_types.UUID(report.ID),
		ReporterUserId:      openapi_types.UUID(report.ReporterUserID),
		ReporterUsername:    &report.ReporterUsername,
		ReporterDisplayName: reporterDisplayName,
		TargetType:          api.ReportTargetType(report.TargetType),
		TargetId:            report.TargetID.String(),
		Reason:              report.Reason,
		Details:             details,
		Status:              api.ReportStatus(report.Status),
		ReviewedBy:          reviewedBy,
		ReviewedAt:          reviewedAt,
		Resolution:          resolution,
		CreatedAt:           report.CreatedAt,
	}
}

// PostReports handles POST /reports (user-facing report submission)
func (h API) PostReports(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	var req api.PostReportsJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	// Parse target ID
	targetID, err := uuid.Parse(req.TargetId)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_target_id", Message: "Invalid target ID format"})
		return
	}

	// Prepare details
	var details string
	if req.Details != nil {
		details = *req.Details
	}

	report, err := h.ModReports.CreateReport(r.Context(), moderation.CreateReportParams{
		ReporterUserID: user.ID,
		TargetType:     string(req.TargetType),
		TargetID:       targetID,
		Reason:         req.Reason,
		Details:        details,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Fetch report with user info for response
	fullReport, err := h.ModReports.GetReport(r.Context(), report.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	response := convertReportToAPI(fullReport)

	writeJSON(w, http.StatusCreated, response)
}

// GetAdminReports handles GET /admin/reports
func (h API) GetAdminReports(w http.ResponseWriter, r *http.Request, params api.GetAdminReportsParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:view_reports"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Build filter options
	limit := int32(50)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	var status *string
	if params.Status != nil {
		s := string(*params.Status)
		status = &s
	}

	var targetType *string
	if params.TargetType != nil {
		t := string(*params.TargetType)
		targetType = &t
	}

	result, err := h.ModReports.ListReports(r.Context(), moderation.ListReportsParams{
		Status:     status,
		TargetType: targetType,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.Report, len(result.Reports))
	for i, report := range result.Reports {
		response[i] = convertListReportToAPI(report)
	}

	writeJSON(w, http.StatusOK, response)
}

// GetAdminReportsReportId handles GET /admin/reports/{reportId}
func (h API) GetAdminReportsReportId(w http.ResponseWriter, r *http.Request, reportId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:view_reports"); err != nil {
		writeServiceError(w, err)
		return
	}

	report, err := h.ModReports.GetReport(r.Context(), uuid.UUID(reportId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	response := convertReportToAPI(report)

	writeJSON(w, http.StatusOK, response)
}

// PatchAdminReportsReportId handles PATCH /admin/reports/{reportId}
func (h API) PatchAdminReportsReportId(w http.ResponseWriter, r *http.Request, reportId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_reports"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PatchAdminReportsReportIdJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	var resolution string
	if req.Resolution != nil {
		resolution = *req.Resolution
	}

	_, err := h.ModReports.UpdateReportStatus(r.Context(), moderation.UpdateReportStatusParams{
		ReportID:   uuid.UUID(reportId),
		Status:     string(req.Status),
		ReviewedBy: user.ID,
		Resolution: resolution,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Report status updated successfully"})
}
