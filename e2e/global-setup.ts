import { PrismaClient } from "@prisma/client";

async function globalSetup() {
  console.log("🧹 Running global test setup...");

  const prisma = new PrismaClient();

  try {
    // Reset all test users to active and verified state
    const testEmails = ["admin@example.com", "editor@example.com", "user@example.com"];

    for (const email of testEmails) {
      await prisma.user.update({
        where: { email },
        data: {
          is_active: true,
          is_verified: true,
        },
      });
    }

    // Clear all login attempts to prevent lockouts
    await prisma.loginAttempt.deleteMany({});

    console.log("✅ Test users reset to active state");
    console.log("✅ Login attempts cleared");
  } catch (error) {
    console.error("❌ Error in global setup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
