import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

export async function requireApiCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return user;
}
