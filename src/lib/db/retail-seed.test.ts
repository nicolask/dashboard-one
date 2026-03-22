// @vitest-environment node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { afterAll, describe, expect, it } from "vitest";

const workspaceDir = process.cwd();
const migrationsDir = path.join(workspaceDir, "prisma", "migrations");
const migrationPaths = fs
  .readdirSync(migrationsDir)
  .sort()
  .map((dir) => path.join(migrationsDir, dir, "migration.sql"))
  .filter((p) => fs.existsSync(p));

function getCount(sqlite: Database.Database, query: string) {
  return Number((sqlite.prepare(query).get() as { count: number }).count);
}

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
        stores: getCount(sqlite, 'SELECT COUNT(*) as count FROM "Store"'),
        categories: getCount(sqlite, 'SELECT COUNT(*) as count FROM "Category"'),
        products: getCount(sqlite, 'SELECT COUNT(*) as count FROM "Product"'),
        metrics: getCount(sqlite, 'SELECT COUNT(*) as count FROM "DailyStoreMetric"'),
        orders: getCount(sqlite, 'SELECT COUNT(*) as count FROM "Order"'),
        employees: getCount(sqlite, 'SELECT COUNT(*) as count FROM "Employee"'),
        workLogs: getCount(sqlite, 'SELECT COUNT(*) as count FROM "EmployeeWorkLog"'),
        dailyStoreCosts: getCount(sqlite, 'SELECT COUNT(*) as count FROM "DailyStoreCost"'),
        scenarioMetrics: getCount(
          sqlite,
          'SELECT COUNT(*) as count FROM "DailyStoreMetric" WHERE "scenarioSlug" IS NOT NULL',
        ),
        scenarioCosts: getCount(
          sqlite,
          'SELECT COUNT(*) as count FROM "DailyStoreCost" WHERE "scenarioSlug" IS NOT NULL',
        ),
      };

      expect(counts.stores).toBeGreaterThan(0);
      expect(counts.categories).toBeGreaterThan(0);
      expect(counts.products).toBeGreaterThan(0);
      expect(counts.metrics).toBeGreaterThan(0);
      expect(counts.orders).toBeGreaterThan(0);
      expect(counts.employees).toBeGreaterThan(0);
      expect(counts.workLogs).toBeGreaterThan(0);
      expect(counts.dailyStoreCosts).toBeGreaterThan(0);
      expect(counts.scenarioMetrics).toBeGreaterThan(0);
      expect(counts.scenarioCosts).toBeGreaterThan(0);

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
      expect(
        Math.abs(sampleMetric.revenue / sampleMetric.orders - sampleMetric.avgBasketValue),
      ).toBeLessThan(0.02);
      expect(Math.abs(sampleMetric.orders / sampleMetric.visitors - sampleMetric.conversionRate)).toBeLessThan(
        0.001,
      );

      const sampleCost = sqlite
        .prepare(
          'SELECT "staffCost", "rentCost", "otherCost", "totalCost", "staffHours", "employeeCount" FROM "DailyStoreCost" WHERE "staffHours" > 0 AND "employeeCount" > 0 LIMIT 1',
        )
        .get() as {
        staffCost: number;
        rentCost: number;
        otherCost: number;
        totalCost: number;
        staffHours: number;
        employeeCount: number;
      };

      expect(sampleCost).toBeDefined();
      expect(sampleCost.staffCost).toBeGreaterThan(0);
      expect(sampleCost.staffHours).toBeGreaterThan(0);
      expect(sampleCost.employeeCount).toBeGreaterThan(0);
      expect(Math.abs(sampleCost.staffCost + sampleCost.rentCost + sampleCost.otherCost - sampleCost.totalCost)).toBeLessThan(0.02);

      const slumpCost = sqlite
        .prepare(
          'SELECT "scenarioSlug", "staffHours" FROM "DailyStoreCost" JOIN "Store" ON "Store"."id" = "DailyStoreCost"."storeId" WHERE "Store"."code" = ? AND "DailyStoreCost"."scenarioSlug" = ? LIMIT 1',
        )
        .get("LEI-01", "store_slump") as {
        scenarioSlug: string;
        staffHours: number;
      };

      expect(slumpCost).toBeDefined();
      expect(slumpCost.scenarioSlug).toBe("store_slump");
      expect(slumpCost.staffHours).toBeGreaterThan(0);
    } finally {
      sqlite.close();
    }
  });
});
