/**
 * PM2 Ecosystem Configuration — LDO-2 EDMS
 *
 * Usage:
 *   npm run build          # build Next.js first
 *   pm2 start ecosystem.config.js
 *
 * NOTE: Run the Next.js server in FORK mode (instances: 1) not cluster mode.
 * The SSE notification registry (src/lib/notifications/sse-registry.ts) is
 * in-process; multiple forks would break real-time notifications. See the
 * TODO in sse-registry.ts for the Redis pub/sub migration path if you need
 * horizontal scaling.
 */

module.exports = {
  apps: [
    {
      name: "ldo2-web",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1, // DO NOT increase without migrating SSE registry to Redis
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Restart on crash, but not on OOM — let the OS signal be visible.
      max_restarts: 10,
      min_uptime: "10s",
      error_file: "logs/web-error.log",
      out_file: "logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "ldo2-workers",
      script: "src/workers/start-workers.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      min_uptime: "10s",
      error_file: "logs/workers-error.log",
      out_file: "logs/workers-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
