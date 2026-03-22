// @vitest-environment node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { afterAll, describe, expect, it } from "vitest";

const workspaceDir = process.cwd();
const migrationPaths = [
  path.join(
    workspaceDir,
    "prisma",
    "migrations",
    "20260321143000_init_user_foundation",
    "migration.sql",
  ),
  path.join(
    workspaceDir,
    "prisma",
    "migrations",
    "20260321222000_add_retail_demo_schema",
    "migration.sql",
  ),
];

function createRetailTestDatabase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-one-retail-seed-"));
  const databasePath = path.join(tempDir, "retail.db");
  const sqlite = new Database(databasePath);

  for (const migrationPath of migrationPaths) {
    sqlite.exec(fs.readFileSync(migrationPath, "utf8"));
  }

  sqlite.close();

  return {
    databasePath,
    tempDir,
  };
}

describe("retail seed integration", () => {
  const { databasePath, tempDir } = createRetailTestDatabase();
  const databaseUrl = `file:${databasePath}`;

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("seeds the retail demo schema with data suitable for KPI reads", { timeout: 20000 }, () => {
    execFileSync(
      "node",
      ["--import", "tsx/esm", "prisma/seed.ts"],
      {
        cwd: workspaceDir,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdio: "ignore",
      },
    );

    const sqlite = new Database(databasePath, { readonly: true });

    try {
      const counts = {
        stores: Number(sqlite.prepare('SELECT COUNT(*) as count FROM "Store"').get().count),
        categories: Number(
          sqlite.prepare('SELECT COUNT(*) as count FROM "Category"').get().count,
        ),
        products: Number(sqlite.prepare('SELECT COUNT(*) as count FROM "Product"').get().count),
        metrics: Number(
          sqlite.prepare('SELECT COUNT(*) as count FROM "DailyStoreMetric"').get().count,
        ),
        orders: Number(sqlite.prepare('SELECT COUNT(*) as count FROM "Order"').get().count),
        scenarioMetrics: Number(
          sqlite
            .prepare('SELECT COUNT(*) as count FROM "DailyStoreMetric" WHERE "scenarioSlug" IS NOT NULL')
            .get().count,
        ),
      };

      expect(counts.stores).toBeGreaterThan(0);
      expect(counts.categories).toBeGreaterThan(0);
      expect(counts.products).toBeGreaterThan(0);
      expect(counts.metrics).toBeGreaterThan(0);
      expect(counts.orders).toBeGreaterThan(0);
      expect(counts.scenarioMetrics).toBeGreaterThan(0);

      const sampleMetric = sqlite
        .prepare(
          'SELECT "revenue", "orders", "visitors", "avgBasketValue", "conversionRate" FROM "DailyStoreMetric" WHERE "orders" > 0 AND "visitors" > 0 LIMIT 1',
        )
        .get() as {
        revenue: number;
        orders: number;
        visitors: number;
        avgBasketValue: number;
        conversionRate: number;
      };

      expect(sampleMetric).toBeDefined();
      expect(Math.abs(sampleMetric.revenue / sampleMetric.orders - sampleMetric.avgBasketValue)).toBeLessThan(0.02);
      expect(Math.abs(sampleMetric.orders / sampleMetric.visitors - sampleMetric.conversionRate)).toBeLessThan(0.001);
    } finally {
      sqlite.close();
    }
  });
});
