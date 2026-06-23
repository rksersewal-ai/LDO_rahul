import { signIn } from "@/lib/auth";

export async function POST() {
  try {
    // Use demo credentials directly
    return await signIn("credentials", {
      username: "admin",
      password: "password123",
      redirect: false,
    });
  } catch (error) {
    console.error("[v0] Demo login error:", error);
    return Response.json(
      { error: "Demo login failed" },
      { status: 500 }
    );
  }
}
