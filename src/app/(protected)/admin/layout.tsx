import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Protected layout already handles unauthenticated users; this guard
  // handles authenticated non-admin users who navigate directly to /admin/*.
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
