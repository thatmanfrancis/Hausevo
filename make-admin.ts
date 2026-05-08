import "dotenv/config";
import prisma from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2] || "admin@gmail.com";
  const password = "Password123";

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`User ${email} not found. Creating a new admin account...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName: "System Admin",
        phoneNumber: "08000000000",
        roles: ["ADMIN"],
        isVerified: true,
        verificationTier: 2,
        onboardingCompleted: true,
      },
    });

    console.log(`✅ Successfully created new ADMIN account!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
  } else {
    console.log(`User ${email} found. Promoting to ADMIN...`);
    const updatedRoles = Array.from(new Set([...user.roles, "ADMIN"]));

    await prisma.user.update({
      where: { email },
      data: { roles: updatedRoles as any },
    });

    console.log(`✅ Successfully promoted ${email} to ADMIN.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
