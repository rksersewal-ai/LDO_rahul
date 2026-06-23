"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="text-xs font-medium text-foreground">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          className="mt-1 flex h-[30px] w-full rounded-md border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-colors disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-xs font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="mt-1 flex h-[30px] w-full rounded-md border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-colors disabled:opacity-50"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex h-[30px] flex-1 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setUsername("admin");
            setPassword("password123");
            setError("");
            setLoading(true);
            try {
              const result = await signIn("credentials", {
                username: "admin",
                password: "password123",
                redirect: false,
              });
              if (result?.error) {
                setError("Demo login failed: " + (result.error || "Unknown error"));
                setLoading(false);
                return;
              }
              if (result?.ok) {
                router.push(callbackUrl);
                router.refresh();
              }
            } catch (err) {
              setError("An unexpected error occurred: " + String(err));
              setLoading(false);
            }
          }}
          className="flex h-[30px] flex-1 items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="size-3 animate-spin" />
            </>
          ) : (
            "Demo"
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm ring-1 ring-foreground/10">
        {/* Branding */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            L2
          </div>
          <h1 className="text-lg font-semibold text-foreground">LDO-2 EDMS</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Engineering Document Management System
          </p>
        </div>

        {/* Login Form */}
        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>

        {/* Demo credentials hint */}
        <div className="mt-4 rounded-md border border-muted bg-muted/30 p-2.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Demo Credentials
          </p>
          <p className="text-[11px] text-muted-foreground">
            Username: <span className="font-mono text-foreground">admin</span> / Password:{" "}
            <span className="font-mono text-foreground">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
