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

  it("uses the configured base URL for direct refresh", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ expiresInSeconds: 3600 }));
    vi.stubGlobal("fetch", fetchMock);

    await createApiClient({ baseUrl: "https://api.example.test" }).refresh();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
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

describe("passkey login", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("begins without account information or session cookies", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ sessionId: "ceremony", options: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await createApiClient({ baseUrl: "https://api.example.test" }).passkeyLoginOptions();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/auth/login/passkey/options");
    expect(init.credentials).toBe("omit");
    expect(init.body).toBeUndefined();
  });

  it("does not refresh another account's session after a rejected passkey", async () => {
    const onSessionExpired = vi.fn();
    const fetchMock = vi.fn(async () => jsonResponse({ code: "unauthorized" }, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await createApiClient({ onSessionExpired }).passkeyLoginVerify({
      sessionId: "ceremony",
      credential: { type: "public-key" },
    });
    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string)).toEqual({
      sessionId: "ceremony",
      credential: { type: "public-key" },
    });
    expect(init.credentials).toBe("include");
  });

  it("sends the preference with the step-up token", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await createApiClient().setPasskeyLogin(true, "stepup");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/auth/mfa/passkey-login");
    expect(init.method).toBe("PUT");
    expect(new Headers(init.headers).get("x-stepup-token")).toBe("stepup");
    expect(JSON.parse(init.body as string)).toEqual({ enabled: true });
  });
});

describe("drawing uploads", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("only sends replay JSON so the server can generate the preview", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        id: "00000000-0000-0000-0000-000000000001",
        formatVersion: 1,
        backgroundColor: "#FFFFFF",
        width: 1200,
        height: 800,
        dataBytes: 10,
        previewBytes: 10,
        previewUrl: "https://example.com/preview.png",
        replayUrl: "https://example.com/replay.json",
        createdAt: "2026-09-22T00:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = createApiClient({ baseUrl: "https://example.com" });
    await api.uploadDrawing(new Blob(["{}"], { type: "application/json" }));

    const body = fetchMock.mock.calls[0][1]?.body;
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect((form.get("data") as File).type).toBe("application/json");
    expect(form.has("preview")).toBe(false);
  });
});
