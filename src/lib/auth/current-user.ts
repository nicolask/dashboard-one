import { cache } from "react";
import { UserStatus } from "@generated/prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/session";

async function loadCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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

  if (!user || user.status !== UserStatus.ACTIVE) {
    return null;
  }

  return user;
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
