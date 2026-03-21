import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/session";

async function loadCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

// Request-scoped caching lets protected layouts and nested dashboard chrome share one auth lookup.
export const getCurrentUser = cache(loadCurrentUser);

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
