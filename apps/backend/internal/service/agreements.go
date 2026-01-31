package service

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"

	"backend/internal/api"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type AgreementsService struct {
	store *repository.Store
}

func NewAgreementsService(store *repository.Store) *AgreementsService {
	return &AgreementsService{store: store}
}

// GetCurrentVersions retrieves the current Terms and Privacy Policy versions from server settings
func (s *AgreementsService) GetCurrentVersions(ctx context.Context) (api.AgreementVersions, error) {
	row, err := s.store.Q.GetAgreementVersions(ctx)
	if err != nil {
		return api.AgreementVersions{}, fmt.Errorf("failed to get agreement versions: %w", err)
	}

	return api.AgreementVersions{
		TermsVersion:   int(row.TermsVersion),
		PrivacyVersion: int(row.PrivacyVersion),
	}, nil
}

// AcceptAgreements records user acceptance of Terms and/or Privacy Policy
// Validates that the versions being accepted match the current server versions
func (s *AgreementsService) AcceptAgreements(ctx context.Context, userID uuid.UUID, req api.AcceptAgreementsRequest) error {
	// Get current versions from server settings
	current, err := s.GetCurrentVersions(ctx)
	if err != nil {
		return fmt.Errorf("failed to get current versions: %w", err)
	}

	// Validate versions if provided
	if req.TermsVersion != nil {
		if *req.TermsVersion != current.TermsVersion {
			return fmt.Errorf("terms version mismatch: expected %d, got %d", current.TermsVersion, *req.TermsVersion)
		}
	}
	if req.PrivacyVersion != nil {
		if *req.PrivacyVersion != current.PrivacyVersion {
			return fmt.Errorf("privacy version mismatch: expected %d, got %d", current.PrivacyVersion, *req.PrivacyVersion)
		}
	}

	// Accept agreements
	params := sqlc.AcceptAgreementsParams{
		ID: userID,
	}
	if req.TermsVersion != nil {
		params.TermsVersion = sql.NullInt32{Int32: int32(*req.TermsVersion), Valid: true}
		slog.Info("accepting terms", "userID", userID, "version", *req.TermsVersion)
	}
	if req.PrivacyVersion != nil {
		params.PrivacyVersion = sql.NullInt32{Int32: int32(*req.PrivacyVersion), Valid: true}
		slog.Info("accepting privacy", "userID", userID, "version", *req.PrivacyVersion)
	}

	result, err := s.store.Q.AcceptAgreements(ctx, params)
	if err != nil {
		return fmt.Errorf("failed to accept agreements: %w", err)
	}

	slog.Info("agreements accepted", "userID", userID, "termsVersion", result.TermsVersion, "privacyVersion", result.PrivacyVersion)

	return nil
}

// CheckUserAgreementStatus checks if a user needs to re-accept agreements
// Returns true if user needs to re-accept (either terms or privacy version is outdated)
func (s *AgreementsService) CheckUserAgreementStatus(ctx context.Context, userID uuid.UUID) (needsUpdate bool, err error) {
	status, err := s.store.Q.CheckUserAgreementStatus(ctx, userID)
	if err != nil {
		return false, fmt.Errorf("failed to check agreement status: %w", err)
	}

	needsUpdate = status.NeedsTermsAgreement || status.NeedsPrivacyAgreement
	return needsUpdate, nil
}
