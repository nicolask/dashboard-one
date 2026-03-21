import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionUserIdMock = vi.fn();
const findFirstMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    cache: <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) => {
      let hasValue = false;
      let cachedValue: TResult;

      return (...args: TArgs) => {
        if (!hasValue) {
          cachedValue = fn(...args);
          hasValue = true;
        }

        return cachedValue;
      };
    },
  };
});

vi.mock("@/lib/auth/session", () => ({
  getSessionUserId: getSessionUserIdMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: findFirstMock,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("current-user", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("caches the current user lookup within a single render path", async () => {
    const user = {
      id: "user_123",
      email: "alice@example.com",
      displayName: "Alice",
      status: "ACTIVE",
      createdAt: new Date("2026-03-21T12:00:00.000Z"),
      lastLoginAt: new Date("2026-03-21T12:30:00.000Z"),
    };

    getSessionUserIdMock.mockResolvedValue("user_123");
    findFirstMock.mockResolvedValue(user);

    const { getCurrentUser } = await import("@/lib/auth/current-user");

    const firstUser = await getCurrentUser();
    const secondUser = await getCurrentUser();

    expect(firstUser).toEqual(user);
    expect(secondUser).toEqual(user);
    expect(getSessionUserIdMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).toHaveBeenCalledTimes(1);
  });

  it("does not hit Prisma when there is no session", async () => {
    getSessionUserIdMock.mockResolvedValue(null);

    const { getCurrentUser } = await import("@/lib/auth/current-user");

    const firstUser = await getCurrentUser();
    const secondUser = await getCurrentUser();

    expect(firstUser).toBeNull();
    expect(secondUser).toBeNull();
    expect(getSessionUserIdMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("returns the cached user from requireCurrentUser when present", async () => {
    const user = {
      id: "user_456",
      email: "bob@example.com",
      displayName: "Bob",
      status: "ACTIVE",
      createdAt: new Date("2026-03-21T14:00:00.000Z"),
      lastLoginAt: null,
    };

    getSessionUserIdMock.mockResolvedValue("user_456");
    findFirstMock.mockResolvedValue(user);

    const { requireCurrentUser } = await import("@/lib/auth/current-user");

    await expect(requireCurrentUser()).resolves.toEqual(user);
    expect(getSessionUserIdMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when requireCurrentUser has no user", async () => {
    getSessionUserIdMock.mockResolvedValue(null);

    const { requireCurrentUser } = await import("@/lib/auth/current-user");

    await expect(requireCurrentUser()).rejects.toThrow("redirect:/login");
    expect(getSessionUserIdMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
