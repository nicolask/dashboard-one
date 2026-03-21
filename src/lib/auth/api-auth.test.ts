import { describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.fn();

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

describe("api-auth", () => {
  it("returns the active user when one is present", async () => {
    const user = {
      id: "user_123",
      email: "alice@example.com",
      displayName: "Alice",
      status: "ACTIVE",
      createdAt: new Date("2026-03-21T12:00:00.000Z"),
      lastLoginAt: null,
    };

    getCurrentUserMock.mockResolvedValue(user);

    const { requireApiCurrentUser } = await import("@/lib/auth/api-auth");

    await expect(requireApiCurrentUser()).resolves.toEqual(user);
  });

  it("returns a 401 response when there is no session user", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const { requireApiCurrentUser } = await import("@/lib/auth/api-auth");
    const response = await requireApiCurrentUser();

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) {
      throw new Error("Expected an unauthorized response.");
    }
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns a 401 response when the account is disabled or missing", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const { requireApiCurrentUser } = await import("@/lib/auth/api-auth");
    const response = await requireApiCurrentUser();

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) {
      throw new Error("Expected an unauthorized response.");
    }
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });
});
