#!/usr/bin/env node

const baseUrl = (
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const checks = [
  { path: "/api/health", name: "health endpoint", expected: (status) => status === 200 },
  { path: "/login", name: "login page", expected: (status) => status >= 200 && status < 400 },
  {
    path: "/documents",
    name: "documents route",
    expected: (status) => status >= 200 && status < 400,
  },
  { path: "/pl", name: "PL hub route", expected: (status) => status >= 200 && status < 400 },
];

const failures = [];

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    if (!check.expected(response.status)) {
      failures.push(`${check.name} returned HTTP ${response.status} at ${url}`);
      continue;
    }
    console.log(`PASS ${check.name}: HTTP ${response.status}`);
  } catch (error) {
    failures.push(
      `${check.name} failed at ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (failures.length > 0) {
  console.error("LAN smoke checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`LAN smoke checks passed for ${baseUrl}`);
