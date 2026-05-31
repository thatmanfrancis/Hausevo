/**
 * make-admin.ts
 * Creates or promotes a fully verified admin account.
 *
 * Usage:
 *   npx tsx make-admin.ts <email> [fullName] [password]
 *
 * Examples:
 *   npx tsx make-admin.ts francis@hausevo.com.ng
 *   npx tsx make-admin.ts francis@hausevo.com.ng "Francis Adebayo"
 *   npx tsx make-admin.ts francis@hausevo.com.ng "Francis Adebayo" MySecurePass123
 *
 * - If the user already exists, they are promoted to ADMIN (roles, isVerified, tier 2).
 * - If they don't exist, a new account is created with the given details.
 * - Password defaults to a random secure string if not provided.
 */

import "dotenv/config";
import prisma from "./src/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const RESET_LINE = "\x1b[0m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

function log(color: string, symbol: string, msg: string) {
  console.log(`${color}${symbol}${RESET_LINE} ${msg}`);
}

async function main() {
  const [, , emailArg, nameArg, passwordArg] = process.argv;

  if (!emailArg) {
    console.error(`${RED}Usage: npx tsx make-admin.ts <email> [fullName] [password]${RESET_LINE}`);
    console.error(`${YELLOW}Example: npx tsx make-admin.ts francis@hausevo.com.ng "Francis Adebayo"${RESET_LINE}`);
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const fullName = nameArg?.trim() || "Hausevo Admin";
  const password = passwordArg?.trim() || crypto.randomBytes(12).toString("base64url");

  console.log(`\n${BOLD}Hausevo Admin Creator${RESET_LINE}`);
  console.log(`${"─".repeat(40)}`);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Promote existing user
    log(YELLOW, "→", `Found existing account: ${existing.fullName} (${email})`);

    const updatedRoles = Array.from(new Set([...existing.roles, "ADMIN"])) as any[];

    await prisma.user.update({
      where: { email },
      data: {
        roles: updatedRoles,
        isVerified: true,
        verificationTier: 2,
        onboardingCompleted: true,
      },
    });

    log(GREEN, "✓", `Promoted to ADMIN with full verification.`);
    console.log(`\n${CYAN}${BOLD}Account details:${RESET_LINE}`);
    console.log(`  Email    : ${email}`);
    console.log(`  Name     : ${existing.fullName}`);
    console.log(`  Roles    : ${updatedRoles.join(", ")}`);
    console.log(`  Password : (unchanged — use existing password or reset it)\n`);
  } else {
    // Create new admin account
    log(CYAN, "→", `No account found for ${email}. Creating new admin...`);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        // No phoneNumber — avoids unique constraint conflicts
        roles: ["ADMIN"],
        isVerified: true,
        verificationTier: 2,
        onboardingCompleted: true,
      },
    });

    log(GREEN, "✓", `Admin account created successfully.`);
    console.log(`\n${CYAN}${BOLD}Account details:${RESET_LINE}`);
    console.log(`  Email    : ${email}`);
    console.log(`  Name     : ${fullName}`);
    console.log(`  Password : ${BOLD}${password}${RESET_LINE}`);
    console.log(`  Roles    : ADMIN`);
    console.log(`  Verified : Tier 2 (full)\n`);
    console.log(`${YELLOW}⚠  Save the password above — it won't be shown again.${RESET_LINE}\n`);
  }
}

main()
  .catch((e) => {
    console.error(`\n${RED}Error:${RESET_LINE}`, e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
