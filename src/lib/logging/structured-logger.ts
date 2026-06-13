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

function writeLog(entry: LogEntry): void {
  try {
    console.error(JSON.stringify(entry));
  } catch {
    // If serialization fails, output a minimal entry
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
    entry.context = context;
  }

  if (error instanceof Error) {
    entry.stack = error.stack;
  } else if (error) {
    entry.stack = String(error);
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
    context,
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
    context,
  });
}
