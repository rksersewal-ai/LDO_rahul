export interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  code?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  context?: LogContext;
  stack?: string;
}

const sensitiveKeyPattern =
  /(secret|password|token|authorization|cookie|database_url|postgres_url|redis_url|auth_secret)/i;

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/:\/\/([^:\s]+):([^@\s]+)@/g, "://$1:***@");
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value && typeof value === "object") {
    return sanitizeContext(value as Record<string, unknown>);
  }
  return value;
}

function sanitizeContext(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : sanitizeValue(value),
    ]),
  );
}

function writeLog(entry: LogEntry): void {
  try {
    const serialized = JSON.stringify(entry);
    // Route to the appropriate console method so log aggregators and shell
    // pipelines can filter by severity without losing structured format.
    if (entry.level === "error") {
      console.error(serialized);
    } else if (entry.level === "warn") {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  } catch {
    // If serialization fails, output a minimal entry to stderr
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Failed to serialize log entry",
      }),
    );
  }
}

/**
 * Log an error with structured JSON output to stderr.
 */
export function logError(message: string, context?: LogContext, error?: Error | unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    message,
  };

  if (context) {
    entry.context = sanitizeContext(context);
  }

  if (process.env.NODE_ENV !== "production") {
    if (error instanceof Error) {
      entry.stack = error.stack;
    } else if (error) {
      entry.stack = String(error);
    }
  }

  writeLog(entry);
}

/**
 * Log a warning with structured JSON output to stderr.
 */
export function logWarn(message: string, context?: LogContext): void {
  writeLog({
    timestamp: new Date().toISOString(),
    level: "warn",
    message,
    context: context ? sanitizeContext(context) : undefined,
  });
}

/**
 * Log an informational message with structured JSON output to stderr.
 */
export function logInfo(message: string, context?: LogContext): void {
  writeLog({
    timestamp: new Date().toISOString(),
    level: "info",
    message,
    context: context ? sanitizeContext(context) : undefined,
  });
}
