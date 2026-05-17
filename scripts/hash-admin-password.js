// ═══════════════════════════════════════════════
// ADMIN PASSWORD HASH GENERATOR
// Run: node scripts/hash-admin-password.js <password>
// Copy the output hash to your SQL INSERT statement
// ═══════════════════════════════════════════════

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-admin-password.js <password>");
  console.error("Example: node scripts/hash-admin-password.js 'Mock24hr@Admin2026'");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

console.log("\n╔══════════════════════════════════════════╗");
console.log("║     ADMIN PASSWORD HASH GENERATED        ║");
console.log("╚══════════════════════════════════════════╝\n");
console.log("Password:", password);
console.log("Hash:    ", hash);
console.log("\n── SQL INSERT ──");
console.log(`INSERT INTO admin_users (username, password_hash)`);
console.log(`VALUES ('superadmin', '${hash}')`);
console.log(`ON CONFLICT (username) DO UPDATE SET password_hash = '${hash}';`);
console.log("\n⚠️  Store this hash in your database. NEVER store the plain password.\n");
