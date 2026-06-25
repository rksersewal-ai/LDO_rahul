import { z } from "zod";

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const isProductionRuntime = process.env.NODE_ENV === "production" && !isBuildPhase;

const booleanString = z.enum(["true", "false"]).optional();
const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalPort = z.coerce.number().int().min(1).max(65535).optional();
const positiveInteger = z.coerce.number().int().positive().optional();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PHASE: z.string().optional(),
    DATABASE_URL: z.string().url().optional(),
    POSTGRES_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(32).optional(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    AUTH_URL: optionalUrl,
    NEXTAUTH_URL: optionalUrl,
    NEXT_PUBLIC_APP_URL: optionalUrl,
    AUTH_TRUST_HOST: booleanString,
    REDIS_URL: optionalUrl,
    STORAGE_NAS_PATH: z.string().min(1).optional(),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: optionalPort,
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),
    DB_POOL_MAX: positiveInteger,
    DB_POOL_IDLE_TIMEOUT_MS: positiveInteger,
    DB_POOL_CONNECTION_TIMEOUT_MS: positiveInteger,
    DOC_MAX_UPLOAD_BYTES: positiveInteger,
    DOC_MAX_CONCURRENT_UPLOADS: positiveInteger,
    OCR_WORKER_CONCURRENCY: positiveInteger,
    OCR_JOB_TIMEOUT_MS: positiveInteger,
    OCR_PER_PAGE_MIN_CHARS: positiveInteger,
    OCR_NATIVE_MIN_CHARS: positiveInteger,
    OCR_RECOGNIZE_TIMEOUT_MS: positiveInteger,
    OCR_WORKER_RECYCLE_AFTER: positiveInteger,
    DEDUP_WORKER_CONCURRENCY: positiveInteger,
    DEDUP_JOB_TIMEOUT_MS: positiveInteger,
    DEDUP_MAX_CANDIDATE_PAIRS: positiveInteger,
    DEDUP_MAX_GROUP_SIZE: positiveInteger,
    DEDUP_YIELD_EVERY: positiveInteger,
    RETENTION_SCAN_INTERVAL_MS: positiveInteger,
    WORKER_LOAD_GATE_ENABLED: booleanString,
    WORKER_LOAD_GATE_THRESHOLD: z.coerce.number().min(0).max(1).optional(),
    WORKER_LOAD_GATE_STEP_MS: positiveInteger,
    WORKER_LOAD_GATE_MAX_WAIT_MS: positiveInteger,
  })
  .superRefine((env, ctx) => {
    const hasDatabaseUrl = Boolean(env.DATABASE_URL || env.POSTGRES_URL);
    const authSecret = env.AUTH_SECRET || env.NEXTAUTH_SECRET;

    if (isProductionRuntime && !hasDatabaseUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL or POSTGRES_URL is required in production runtime.",
      });
    }

    if (isProductionRuntime && !authSecret) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET or NEXTAUTH_SECRET is required in production runtime.",
      });
    }

    if (
      isProductionRuntime &&
      (authSecret?.includes("change-this") || authSecret?.includes("development-only"))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET must not use the example or development placeholder value.",
      });
    }

    const hasAnySmtp = Boolean(env.SMTP_HOST || env.SMTP_USER || env.SMTP_PASS || env.SMTP_FROM);
    if (hasAnySmtp && !env.SMTP_HOST) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: "SMTP_HOST is required when SMTP is configured.",
      });
    }
    if (hasAnySmtp && !env.SMTP_FROM) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_FROM"],
        message: "SMTP_FROM is required when SMTP is configured.",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
}

export function validateEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatIssues(result.error)}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function getDatabaseUrl(): string {
  const env = validateEnv();
  const url = env.DATABASE_URL || env.POSTGRES_URL;

  if (url) return url;

  if (isProductionRuntime) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) environment variable is required in production",
    );
  }

  return "postgresql://postgres:postgres@localhost:5432/ldo2_edms";
}

export function getAuthSecret(): string | undefined {
  const env = validateEnv();
  return env.AUTH_SECRET || env.NEXTAUTH_SECRET;
}
