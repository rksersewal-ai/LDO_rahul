export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            L2
          </div>
          <h1 className="text-lg font-semibold">LDO-2 EDMS</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Engineering Document Management System
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="user@ldo.railways.gov.in"
              className="mt-1 flex h-[30px] w-full rounded-md border bg-background px-3 text-xs"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              className="mt-1 flex h-[30px] w-full rounded-md border bg-background px-3 text-xs"
              readOnly
            />
          </div>
          <button
            type="button"
            className="flex h-[30px] w-full items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold"
          >
            Sign in
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Login functionality will be implemented in FEAT-004
        </p>
      </div>
    </div>
  );
}
