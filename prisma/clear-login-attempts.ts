import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearLoginAttempts() {
  console.log("🧹 Clearing login attempts...");

  try {
    // Clear all login attempts
    const result = await prisma.loginAttempt.deleteMany({});
    console.log(`✅ Cleared ${result.count} login attempts`);

    // Also clear any pending auth tokens
    const pendingResult = await prisma.pendingAuth.deleteMany({});
    console.log(`✅ Cleared ${pendingResult.count} pending auth tokens`);
  } catch (error) {
    console.error("❌ Error clearing login attempts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearLoginAttempts();
