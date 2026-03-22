// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
};
const cookiesMock = vi.fn(async () => cookieStore);

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "12345678901234567890123456789012";
  });

  it("creates and reads a session token roundtrip", async () => {
    const { createSessionToken, readSessionToken } = await import("@/lib/auth/session");

    const token = await createSessionToken("user-123");
    const payload = await readSessionToken(token);

    expect(payload).toEqual({ sub: "user-123" });
  });

  it("returns null for invalid or tampered tokens", async () => {
    const { createSessionToken, readSessionToken } = await import("@/lib/auth/session");

    const token = await createSessionToken("user-123");

    await expect(readSessionToken(`${token}tampered`)).resolves.toBeNull();
    await expect(readSessionToken("not-a-token")).resolves.toBeNull();
  });

  it("writes, clears, and reads the session cookie", async () => {
    const { setSessionCookie, clearSessionCookie, getSessionUserId } = await import(
      "@/lib/auth/session"
    );

    await setSessionCookie("user-123");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "dashboard-one-session",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );

    const token = cookieStore.set.mock.calls[0]?.[1];
    cookieStore.get.mockReturnValue({ value: token });

    await expect(getSessionUserId()).resolves.toBe("user-123");

    await clearSessionCookie();
    expect(cookieStore.delete).toHaveBeenCalledWith("dashboard-one-session");
  });
});
