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

	fmt.Println("╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║               Admin Permission Diagnostic Report              ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")
	fmt.Println()

	var hasPermission bool
	err = sqlDB.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM permissions WHERE id = $1
		)
	`, "admin:users:read").Scan(&hasPermission)
	if err != nil {
		log.Fatalf("Failed to check permission: %v", err)
	}
	if hasPermission {
		fmt.Println("✅ permissions table: admin:users:read exists")
	} else {
		fmt.Println("❌ permissions table: admin:users:read MISSING")
	}

	var hasRolePermission bool
	err = sqlDB.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM role_permissions
			WHERE role_id = 'admin'
			AND permission_id = $1
			AND scope = 'global'
			AND effect = 'allow'
		)
	`, "admin:users:read").Scan(&hasRolePermission)
	if err != nil {
		log.Fatalf("Failed to check role permission: %v", err)
	}
	if hasRolePermission {
		fmt.Println("✅ role_permissions: admin has allow on admin:users:read")
	} else {
		fmt.Println("❌ role_permissions: admin lacks allow on admin:users:read")
	}

	fmt.Println()
	fmt.Println("Admin permissions currently in DB:")
	rows, err := sqlDB.QueryContext(ctx, `
		SELECT id FROM permissions
		WHERE id LIKE 'admin:%'
		ORDER BY id
	`)
	if err != nil {
		log.Fatalf("Failed to list permissions: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			log.Fatalf("Failed to scan permission: %v", err)
		}
		fmt.Printf("  • %s\n", id)
	}

	if err := rows.Err(); err != nil {
		log.Fatalf("Failed to iterate permissions: %v", err)
	}
}
