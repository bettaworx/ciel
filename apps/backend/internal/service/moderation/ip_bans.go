package moderation

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"time"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
)

// IPBansService handles IP ban operations
type IPBansService struct {
	store       *repository.Store
	logsService *LogsService
}

// NewIPBansService creates a new IPBansService
func NewIPBansService(store *repository.Store, logsService *LogsService) *IPBansService {
	return &IPBansService{
		store:       store,
		logsService: logsService,
	}
}

// CreateIPBanParams contains parameters for creating an IP ban
type CreateIPBanParams struct {
	IPAddress string
	Reason    string
	BannedBy  uuid.UUID
	ExpiresAt *time.Time
}

// CreateIPBan creates a new IP ban
func (s *IPBansService) CreateIPBan(ctx context.Context, params CreateIPBanParams) (sqlc.IpBan, error) {
	// Prepare nullable parameters
	var reason sql.NullString
	if params.Reason != "" {
		reason = sql.NullString{String: params.Reason, Valid: true}
	}

	var expiresAt sql.NullTime
	if params.ExpiresAt != nil {
		expiresAt = sql.NullTime{Time: *params.ExpiresAt, Valid: true}
	}

	// Parse IP address
	ip := net.ParseIP(params.IPAddress)
	if ip == nil {
		return sqlc.IpBan{}, fmt.Errorf("invalid IP address: %s", params.IPAddress)
	}

	// Create IPNet with appropriate mask
	var ipNet net.IPNet
	if ip.To4() != nil {
		ipNet = net.IPNet{IP: ip, Mask: net.CIDRMask(32, 32)} // IPv4
	} else {
		ipNet = net.IPNet{IP: ip, Mask: net.CIDRMask(128, 128)} // IPv6
	}

	// Create IP ban
	ban, err := s.store.Q.CreateIPBan(ctx, sqlc.CreateIPBanParams{
		IpAddress: pqtype.Inet{IPNet: ipNet, Valid: true},
		Reason:    reason,
		BannedBy:  params.BannedBy,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return sqlc.IpBan{}, fmt.Errorf("failed to create IP ban: %w", err)
	}

	// Log the action
	details := fmt.Sprintf("ip=%s reason=%s", params.IPAddress, params.Reason)
	if params.ExpiresAt != nil {
		details += fmt.Sprintf(" expires=%s", params.ExpiresAt.Format(time.RFC3339))
	}

	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: params.BannedBy,
		Action:      "create_ip_ban",
		TargetType:  "ip_ban",
		TargetID:    ban.ID.String(),
		Details:     details,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log IP ban creation: %v\n", err)
	}

	return ban, nil
}

// ListIPBans returns a paginated list of active IP bans
func (s *IPBansService) ListIPBans(ctx context.Context, limit, offset int32) ([]sqlc.IpBan, int64, error) {
	// Get IP bans
	bans, err := s.store.Q.ListIPBans(ctx, sqlc.ListIPBansParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list IP bans: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountIPBans(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count IP bans: %w", err)
	}

	return bans, total, nil
}

// CheckIPBanned checks if an IP address is currently banned
func (s *IPBansService) CheckIPBanned(ctx context.Context, ipAddress string) (bool, error) {
	// Parse IP address
	ip := net.ParseIP(ipAddress)
	if ip == nil {
		return false, fmt.Errorf("invalid IP address: %s", ipAddress)
	}

	// Create IPNet with appropriate mask
	var ipNet net.IPNet
	if ip.To4() != nil {
		ipNet = net.IPNet{IP: ip, Mask: net.CIDRMask(32, 32)} // IPv4
	} else {
		ipNet = net.IPNet{IP: ip, Mask: net.CIDRMask(128, 128)} // IPv6
	}

	isBanned, err := s.store.Q.CheckIPBanned(ctx, pqtype.Inet{IPNet: ipNet, Valid: true})
	if err != nil {
		return false, fmt.Errorf("failed to check IP banned: %w", err)
	}

	return isBanned, nil
}

// DeleteIPBan removes an IP ban by ID
func (s *IPBansService) DeleteIPBan(ctx context.Context, id, adminUserID uuid.UUID) error {
	err := s.store.Q.DeleteIPBan(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete IP ban: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_ip_ban",
		TargetType:  "ip_ban",
		TargetID:    id.String(),
		Details:     "removed IP ban",
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log IP ban deletion: %v\n", err)
	}

	return nil
}

// DeleteIPBanByAddress removes an IP ban by address
func (s *IPBansService) DeleteIPBanByAddress(ctx context.Context, ipAddress string, adminUserID uuid.UUID) error {
	// Parse IP address
	ip := net.ParseIP(ipAddress)
	if ip == nil {
		return fmt.Errorf("invalid IP address: %s", ipAddress)
	}

	// Create IPNet with appropriate mask
	var ipNet net.IPNet
	if ip.To4() != nil {
		ipNet = net.IPNet{IP: ip, Mask: net.CIDRMask(32, 32)} // IPv4
	} else {
		ipNet = net.IPNet{IP: ip, Mask: net.CIDRMask(128, 128)} // IPv6
	}

	err := s.store.Q.DeleteIPBanByAddress(ctx, pqtype.Inet{IPNet: ipNet, Valid: true})
	if err != nil {
		return fmt.Errorf("failed to delete IP ban by address: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_ip_ban_by_address",
		TargetType:  "ip_ban",
		TargetID:    ipAddress,
		Details:     fmt.Sprintf("removed IP ban for %s", ipAddress),
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log IP ban deletion: %v\n", err)
	}

	return nil
}

// CleanupExpiredIPBans removes all expired IP bans
func (s *IPBansService) CleanupExpiredIPBans(ctx context.Context) error {
	err := s.store.Q.CleanupExpiredIPBans(ctx)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired IP bans: %w", err)
	}

	return nil
}
