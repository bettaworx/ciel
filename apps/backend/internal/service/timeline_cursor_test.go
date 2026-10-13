package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestTimelineCursorTimestamp(t *testing.T) {
	created := time.Date(2026, 10, 13, 1, 2, 3, 123456000, time.UTC)
	for _, exact := range []bool{false, true} {
		name := "legacy milliseconds"
		cursor := timelineCursor{Score: created.UnixMilli(), ID: uuid.NewString()}
		want := created.Truncate(time.Millisecond)
		if exact {
			name = "database precision"
			cursor.Time = &created
			want = created
		}
		t.Run(name, func(t *testing.T) {
			encoded := encodeCursor(cursor)
			decoded, err := decodeCursor(&encoded)
			if err != nil {
				t.Fatal(err)
			}
			if !decoded.timestamp().Equal(want) {
				t.Fatalf("timestamp = %v, want %v", decoded.timestamp(), want)
			}
			if decoded.Score != created.UnixMilli() || decoded.ID != cursor.ID {
				t.Fatalf("Redis score or ID changed: %+v", decoded)
			}
		})
	}
}
