import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireCurrentUser();

  return children;
}
