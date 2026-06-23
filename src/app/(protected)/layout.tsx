import { redirect } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <ProtectedShell>{children}</ProtectedShell>;
}
