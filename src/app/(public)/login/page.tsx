import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { login } from "@/lib/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage =
    params?.error === "invalid" ? "Invalid email or password." : undefined;

  return <LoginForm action={login} errorMessage={errorMessage} />;
}
