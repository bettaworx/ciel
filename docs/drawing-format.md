# Drawing replay format v1

Drawing posts store an immutable replay document and a static WebP preview. A post is either a standard text/media post or a drawing post; the two modes cannot be combined.

## Canvas and limits

| Item | Limit |
| --- | ---: |
| Canvas | 1200 x 800 px (3:2) |
| Coordinate unit | Q4 (1 unit = 0.25 px) |
| Upload JSON | 16 MiB |
| Stored gzip replay | 4 MiB |
| WebP preview | 2 MiB |
| Strokes | 10,000 |
| Points across all strokes | 250,000 |

Clients should read the same values from the public server configuration before drawing or uploading.

## JSON document

```json
{
  "version": 1,
  "background": "#FFFFFF",
  "strokes": [
    {
      "color": "#0A1B2C",
      "size": 24,
      "points": [
        [0, 400, 800, 512],
        [8, 4, -2, 600]
      ]
    }
  ]
}
```

- Colors are `#RRGGBB`; the server normalizes lowercase input to uppercase.
- Brush `size` is an integer from 1 through 1200 in Q4 units.
- Every point is `[delayMs, xOrDxQ4, yOrDyQ4, pressure]`.
- A stroke's first point contains absolute canvas coordinates. Later points contain signed deltas from the preceding point. This reduces storage while retaining replay order and timing.
- `delayMs` is 0 through 60,000. `pressure` is 0 through 1024.
- Reconstructed coordinates must stay within `(0, 0)` through `(4800, 3200)`, inclusive.
- Unknown fields and trailing JSON values are rejected. The accepted document is normalized, encoded as JSON, and stored with gzip.

The version field is the compatibility boundary. A future incompatible representation must use a new version rather than changing version 1 semantics.

## Capacity measurements

Measured on 2026-09-22 with Go's standard JSON and gzip implementations on Windows/amd64 (Intel Core i5-1334U). `smooth` uses small repeated deltas; `noisy` uses deterministic random deltas, delays, and pressure values.

| Points | Smooth input | Smooth stored | Noisy input | Noisy stored |
| ---: | ---: | ---: | ---: | ---: |
| 10,000 | 0.121 MiB | 0.001 MiB | 0.137 MiB | 0.046 MiB |
| 50,000 | 0.604 MiB | 0.002 MiB | 0.686 MiB | 0.228 MiB |
| 100,000 | 1.208 MiB | 0.004 MiB | 1.371 MiB | 0.455 MiB |
| 250,000 | 3.020 MiB | 0.010 MiB | 3.428 MiB | 1.136 MiB |

Run the reproducible benchmark with:

```bash
cd apps/backend
go test ./internal/service -run '^$' -bench BenchmarkDrawingEncoding -benchtime=1x
```

The point ceiling is the primary replay complexity bound. The independent 4 MiB stored-size check also rejects unusually incompressible documents.
