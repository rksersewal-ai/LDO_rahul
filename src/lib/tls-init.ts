// This file is imported before any database connections to disable
// TLS certificate validation for development against Supabase.
// In production, proper certificates should be used.
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
