package sqlc

// Keeps go.mod stable when go mod tidy runs without the generated code, which
// is not committed. See internal/api/generate.go.
import _ "github.com/lib/pq"

//go:generate go run github.com/sqlc-dev/sqlc/cmd/sqlc generate -f ../../../sqlc.yaml
