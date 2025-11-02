import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetTestUsers() {
  console.log("🔧 Resetting test user states...");

  try {
    // Reset all test users to active and verified state
    const testEmails = ["admin@example.com", "editor@example.com", "user@example.com"];

    for (const email of testEmails) {
      const result = await prisma.user.update({
        where: { email },
        data: {
          is_active: true,
          is_verified: true,
        },
      });
      console.log(`✅ Reset ${email} - active: ${result.is_active}, verified: ${result.is_verified}`);
    }

    // Clear all login attempts to prevent lockouts
    const cleared = await prisma.loginAttempt.deleteMany({});
    console.log(`✅ Cleared ${cleared.count} login attempts`);
  } catch (error) {
    console.error("❌ Error resetting test users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestUsers();
