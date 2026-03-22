import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes and verifies a password roundtrip", () => {
    const hash = hashPassword("ChangeMe123!");

    expect(hash).toMatch(/^scrypt\$/);
    expect(verifyPassword("ChangeMe123!", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("returns false for malformed password hashes", () => {
    expect(verifyPassword("ChangeMe123!", "invalid")).toBe(false);
    expect(verifyPassword("ChangeMe123!", "argon2$salt$hash")).toBe(false);
  });
});
