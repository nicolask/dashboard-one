import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { afterAll, describe, expect, it } from "vitest";

const migrationSqlPath = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260321143000_init_user_foundation",
  "migration.sql",
);

function createTestDatabase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-one-prisma-"));
  const databasePath = path.join(tempDir, "test.db");
  const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");
  const sqlite = new Database(databasePath);

  sqlite.exec(migrationSql);
  sqlite.close();

  return {
    databasePath,
    tempDir,
  };
}

describe("prisma", () => {
  const { databasePath, tempDir } = createTestDatabase();
  process.env.DATABASE_URL = `file:${databasePath}`;

  afterAll(async () => {
    const { prisma } = await import("@/lib/db/prisma");

    await prisma.$disconnect();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates and reads a user through the generated client", async () => {
    const { createPrismaClient } = await import("@/lib/db/prisma");
    const prisma = createPrismaClient(`file:${databasePath}`);

    const createdUser = await prisma.user.create({
      data: {
        email: "alice@example.com",
        displayName: "Alice",
        passwordHash: "hashed-password",
      },
    });

    const storedUser = await prisma.user.findUnique({
      where: {
        email: "alice@example.com",
      },
    });

    expect(createdUser.email).toBe("alice@example.com");
    expect(storedUser?.id).toBe(createdUser.id);
    expect(storedUser?.displayName).toBe("Alice");
    expect(storedUser?.status).toBe("ACTIVE");

    await prisma.$disconnect();
  });
});
