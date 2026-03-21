"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/login?error=invalid");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });

  if (!user || !user.passwordHash || user.status !== "ACTIVE") {
    redirect("/login?error=invalid");
  }

  const passwordIsValid = verifyPassword(password, user.passwordHash);

  if (!passwordIsValid) {
    redirect("/login?error=invalid");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  await setSessionCookie(user.id);

  redirect("/dashboard");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
