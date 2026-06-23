import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  // Create a simple session cookie for demo mode
  const cookieStore = await cookies();
  
  // Set a demo session marker
  cookieStore.set("demo-session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60, // 8 hours
  });

  redirect("/");
}
