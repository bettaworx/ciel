#!/bin/sh
exec /app/migrate -path /app/db/migrations -database "$DATABASE_URL" "$@"
