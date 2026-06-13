import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProtectedShell } from "./protected-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <ProtectedShell>{children}</ProtectedShell>;
}
