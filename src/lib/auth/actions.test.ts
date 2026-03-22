import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const verifyPasswordMock = vi.fn();
const setSessionCookieMock = vi.fn();
const clearSessionCookieMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: verifyPasswordMock,
}));

vi.mock("@/lib/auth/session", () => ({
  setSessionCookie: setSessionCookieMock,
  clearSessionCookie: clearSessionCookieMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

function buildFormData(email = "demo@example.com", password = "ChangeMe123!") {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in an active user, updates lastLoginAt, and sets the session cookie", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-123",
      email: "demo@example.com",
      passwordHash: "stored-hash",
      status: "ACTIVE",
    });
    verifyPasswordMock.mockReturnValue(true);

    const { login } = await import("@/lib/auth/actions");

    await expect(login(buildFormData(" Demo@Example.com ", "ChangeMe123!"))).rejects.toThrow(
      "redirect:/dashboard",
    );

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        email: "demo@example.com",
      },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: {
        id: "user-123",
      },
      data: {
        lastLoginAt: expect.any(Date),
      },
    });
    expect(setSessionCookieMock).toHaveBeenCalledWith("user-123");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to invalid when credentials are wrong or the user is disabled", async () => {
    const { login } = await import("@/lib/auth/actions");

    findUniqueMock.mockResolvedValueOnce(null);
    await expect(login(buildFormData())).rejects.toThrow("redirect:/login?error=invalid");

    findUniqueMock.mockResolvedValueOnce({
      id: "user-123",
      email: "demo@example.com",
      passwordHash: "stored-hash",
      status: "DISABLED",
    });
    await expect(login(buildFormData())).rejects.toThrow("redirect:/login?error=invalid");

    findUniqueMock.mockResolvedValueOnce({
      id: "user-123",
      email: "demo@example.com",
      passwordHash: "stored-hash",
      status: "ACTIVE",
    });
    verifyPasswordMock.mockReturnValueOnce(false);
    await expect(login(buildFormData())).rejects.toThrow("redirect:/login?error=invalid");

    expect(setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("clears the session and redirects on logout", async () => {
    const { logout } = await import("@/lib/auth/actions");

    await expect(logout()).rejects.toThrow("redirect:/login");

    expect(clearSessionCookieMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
