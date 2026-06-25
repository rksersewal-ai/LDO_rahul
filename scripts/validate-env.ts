import { validateEnv } from "../src/lib/env";

try {
  validateEnv();
  console.log("Environment configuration is valid.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
