import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/client";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

describe("createApiClient session refresh", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares a single refresh request across concurrent clients", async () => {
    let timelineRequests = 0;
    const onSessionExpired = vi.fn();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/auth/refresh")) {
        return jsonResponse({ expiresInSeconds: 3600 });
      }

      if (url.endsWith("/timeline")) {
        timelineRequests += 1;
        if (timelineRequests <= 2) {
          return jsonResponse({ code: "unauthorized", message: "expired" }, { status: 401 });
        }
        return jsonResponse({ items: [], nextCursor: null });
      }

      return jsonResponse({ code: "not_found", message: "not found" }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const clientA = createApiClient({ onSessionExpired });
    const clientB = createApiClient({ onSessionExpired });

    const [resultA, resultB] = await Promise.all([
      clientA.requestRaw("GET", "/timeline"),
      clientB.requestRaw("GET", "/timeline"),
    ]);

    const refreshCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith("/auth/refresh"),
    );

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    expect(refreshCalls).toHaveLength(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });
});

describe("drawing uploads", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends replay JSON and WebP without media normalization", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        id: "00000000-0000-0000-0000-000000000001",
        formatVersion: 1,
        backgroundColor: "#FFFFFF",
        width: 1200,
        height: 800,
        dataBytes: 10,
        previewBytes: 10,
        previewUrl: "https://example.com/preview.webp",
        replayUrl: "https://example.com/replay.json",
        createdAt: "2026-09-22T00:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = createApiClient({ baseUrl: "https://example.com" });
    await api.uploadDrawing(
      new Blob(["{}"], { type: "application/json" }),
      new Blob(["webp"], { type: "image/webp" }),
    );

    const body = fetchMock.mock.calls[0][1]?.body;
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect((form.get("data") as File).type).toBe("application/json");
    expect((form.get("preview") as File).type).toBe("image/webp");
  });
});
