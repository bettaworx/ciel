package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"backend/internal/db"
	"backend/internal/repository"

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

	store := repository.NewStore(sqlDB)
	ctx := context.Background()

	// List all users with their roles
	users, err := store.Q.ListUsers(ctx)
	if err != nil {
		log.Fatalf("Failed to list users: %v", err)
	}

	fmt.Println("╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                    Users and Roles Report                      ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")
	fmt.Println()

	if len(users) == 0 {
		fmt.Println("⚠️  No users found in database")
		return
	}

	for i, user := range users {
		fmt.Printf("User #%d\n", i+1)
		fmt.Println("────────────────────────────────────────────────────────────────")
		fmt.Printf("  Username:     %s\n", user.Username)
		fmt.Printf("  ID:           %s\n", user.ID)

		if user.DisplayName.Valid {
			fmt.Printf("  Display Name: %s\n", user.DisplayName.String)
		}

		fmt.Printf("  Created:      %s\n", user.CreatedAt.Format("2006-01-02 15:04:05"))

		roles, err := store.Q.GetUserRoles(ctx, user.ID)
		if err != nil {
			fmt.Printf("  ❌ Error fetching roles: %v\n", err)
			fmt.Println()
			continue
		}

		if len(roles) == 0 {
			fmt.Printf("  Roles:        ⚠️  (none assigned)\n")
			fmt.Println()
			fmt.Println("  ⚠️  WARNING: User has no roles assigned!")
			fmt.Println("     This user will not have any permissions.")
		} else {
			fmt.Printf("  Roles:        ")
			for j, role := range roles {
				if j > 0 {
					fmt.Print(", ")
				}
				if role == "admin" {
					fmt.Printf("✅ %s", role)
				} else {
					fmt.Printf("%s", role)
				}
			}
			fmt.Println()
		}
		fmt.Println()
	}

	// List all available roles
	fmt.Println("╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                      Available Roles                           ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")
	fmt.Println()

	roles, err := store.Q.ListRoles(ctx)
	if err != nil {
		log.Fatalf("Failed to list roles: %v", err)
	}

	for _, role := range roles {
		fmt.Printf("  • %s\n", role)
	}

	fmt.Println()
	fmt.Println("╔════════════════════════════════════════════════════════════════╗")
	fmt.Println("║                        Diagnosis Tips                          ║")
	fmt.Println("╚════════════════════════════════════════════════════════════════╝")
	fmt.Println()
	fmt.Println("If a user has no roles or missing 'admin' role:")
	fmt.Println()
	fmt.Println("1. To add admin role to a user, run:")
	fmt.Println("   psql \"$DATABASE_URL\" -c \"INSERT INTO user_roles (user_id, role_id) VALUES ('<user_id>', 'admin') ON CONFLICT DO NOTHING;\"")
	fmt.Println()
	fmt.Println("2. Or use the fix script:")
	fmt.Println("   go run scripts/fix_admin_role.go <username>")
	fmt.Println()
}
