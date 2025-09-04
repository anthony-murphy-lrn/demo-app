import { PrismaClient } from "../generated/prisma";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with SQLite-specific configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./dev.db",
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection established successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✅ Database connection closed successfully");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
}

// Handle process termination
process.on("beforeExit", async () => {
  await disconnectDatabase();
});

process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;
