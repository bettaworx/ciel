//go:build tools

package tools

// The migrate CLI is not imported here: its driver files would put the dependencies of
// every database it supports into go.mod. It is run as cmd/migrate@<version> instead
// (Dockerfile.backend, scripts/migrate.mjs), at the version this module requires.
import (
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen"
	_ "github.com/sqlc-dev/sqlc/cmd/sqlc"
)
