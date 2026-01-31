package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"backend/internal/db"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env.local
	if err := godotenv.Load(".env.local"); err != nil {
		log.Printf("Warning: .env.local not found: %v", err)
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	sqlDB, err := db.Open(databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer sqlDB.Close()

	ctx := context.Background()

	migration := `
-- Add missing admin permissions referenced in handlers
INSERT INTO permissions (id, name, description) VALUES
  ('admin:users:read', 'Admin users read', 'Read user information and search users'),
  ('admin:users:write', 'Admin users write', 'Modify user information and manage user notes'),
  ('admin:invites:read', 'Admin invites read', 'View invite codes and settings'),
  ('admin:invites:write', 'Admin invites write', 'Create and manage invite codes'),
  ('admin:agreements:manage', 'Admin agreements manage', 'Create, update, publish, and delete agreement documents'),
  ('admin:moderation:manage_banned_content', 'Admin moderation manage banned content', 'Manage banned words, images, and hashes'),
  ('admin:moderation:manage_ip_bans', 'Admin moderation manage IP bans', 'Create and remove IP bans'),
  ('admin:moderation:manage_media', 'Admin moderation manage media', 'Review and delete uploaded media'),
  ('admin:moderation:manage_mutes', 'Admin moderation manage mutes', 'Create and remove user mutes'),
  ('admin:moderation:manage_posts', 'Admin moderation manage posts', 'Review, hide, and delete posts'),
  ('admin:moderation:manage_reports', 'Admin moderation manage reports', 'Resolve and manage reports'),
  ('admin:moderation:view_logs', 'Admin moderation view logs', 'View moderation logs'),
  ('admin:moderation:view_reports', 'Admin moderation view reports', 'View reports and report details')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, scope, effect)
SELECT 'admin', id, 'global', 'allow'
FROM permissions
WHERE id LIKE 'admin:%'
  AND id NOT IN (
    SELECT permission_id FROM role_permissions
    WHERE role_id = 'admin' AND scope = 'global'
  )
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
`

	fmt.Println("Applying migration: Add missing admin permissions...")

	_, err = sqlDB.ExecContext(ctx, migration)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("✅ Migration applied successfully!")
	fmt.Println()
	fmt.Println("New permissions added:")
	fmt.Println("  • admin:users:read")
	fmt.Println("  • admin:users:write")
	fmt.Println("  • admin:invites:read")
	fmt.Println("  • admin:invites:write")
	fmt.Println("  • admin:agreements:manage")
	fmt.Println("  • admin:moderation:manage_banned_content")
	fmt.Println("  • admin:moderation:manage_ip_bans")
	fmt.Println("  • admin:moderation:manage_media")
	fmt.Println("  • admin:moderation:manage_mutes")
	fmt.Println("  • admin:moderation:manage_posts")
	fmt.Println("  • admin:moderation:manage_reports")
	fmt.Println("  • admin:moderation:view_logs")
	fmt.Println("  • admin:moderation:view_reports")
	fmt.Println()
	fmt.Println("All permissions granted to 'admin' role.")
	fmt.Println()
	fmt.Println("🎉 You can now access admin endpoints!")
}
