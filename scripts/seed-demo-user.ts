import "dotenv/config";

import { hashPassword } from "../src/lib/auth/password";
import { createPrismaClient } from "../src/lib/db/prisma";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set.`);
  }

  return value;
}

const prisma = createPrismaClient(getRequiredEnv("DATABASE_URL"));
const email = getRequiredEnv("DEMO_LOGIN_EMAIL").trim().toLowerCase();
const passwordHash = hashPassword(getRequiredEnv("DEMO_LOGIN_PASSWORD"));

await prisma.user.upsert({
  where: {
    email,
  },
  update: {
    displayName: "Demo User",
    passwordHash,
    status: "ACTIVE",
  },
  create: {
    email,
    displayName: "Demo User",
    passwordHash,
    status: "ACTIVE",
  },
});

await prisma.$disconnect();

console.log(`Seeded demo user: ${email}`);
