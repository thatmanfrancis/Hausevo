import "dotenv/config";
import prisma from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function check() {
  const user = await prisma.user.findUnique({ where: { email: "admin@gmail.com" } });
  console.log("User exists:", !!user);
  if (user) {
    console.log("User email:", user.email);
    console.log("Is Verified:", user.isVerified);
    console.log("Has password hash:", !!user.passwordHash);
    
    // Check both lowercase and uppercase password
    const lowerMatch = await bcrypt.compare("password123", user.passwordHash!);
    const upperMatch = await bcrypt.compare("Password123", user.passwordHash!);
    
    console.log("Matches 'password123':", lowerMatch);
    console.log("Matches 'Password123':", upperMatch);
  }
}

check().finally(() => prisma.$disconnect());
