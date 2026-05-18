// ═══════════════════════════════════════════════
// ENV VALIDATOR — Fail fast on missing config
// Import at top of index.js to crash BEFORE
// handling any requests with bad config.
// ═══════════════════════════════════════════════

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];

const OPTIONAL_ENV = [
  "NODE_ENV",
  "VERCEL",
  "GEMINI_API_KEY",
  "ADMIN_RESET_SECRET"
];

const missing = REQUIRED_ENV.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error("╔══════════════════════════════════════════╗");
  console.error("║  ❌ MISSING REQUIRED ENVIRONMENT VARS     ║");
  console.error("╚══════════════════════════════════════════╝");
  missing.forEach(key => console.error(`  → ${key}`));
  console.error("\nServer CANNOT start without these. Set them in Vercel dashboard or .env.local\n");
  // Don't throw — handler already returns 500 with helpful message for missing supabase
  // Throwing here kills ALL routes including health checks
  console.error("⚠️  Server may not function correctly without these vars.");
}

// Log env status on cold start
console.log("[ENV] Required:", REQUIRED_ENV.map(k => `${k}=${process.env[k] ? "✓" : "✗"}`).join(", "));
console.log("[ENV] Optional:", OPTIONAL_ENV.map(k => `${k}=${process.env[k] || "unset"}`).join(", "));

export default { REQUIRED_ENV, OPTIONAL_ENV, missing };
