import { execFileSync } from "node:child_process";

import Database from "better-sqlite3";

function run(command, args) {
  execFileSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  return databaseUrl;
}

function getSqlitePath(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must use the SQLite file: protocol.");
  }

  return databaseUrl.slice("file:".length);
}

function readCount(database, tableName) {
  const table = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);

  if (!table) {
    return 0;
  }

  const result = database.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();

  return Number(result.count ?? 0);
}

async function main() {
  run("npx", ["prisma", "migrate", "deploy"]);

  const database = new Database(getSqlitePath(getDatabaseUrl()));

  try {
    const userCount = readCount(database, "User");
    const categoryCount = readCount(database, "Category");
    const storeCount = readCount(database, "Store");

    if (userCount > 0 && categoryCount > 0 && storeCount > 0) {
      console.log("Railway bootstrap: demo data already present, skipping seed.");
      return;
    }

    console.log("Railway bootstrap: seeding demo data.");
    run("npm", ["run", "railway:seed-demo"]);
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
