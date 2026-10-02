import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is required for database-backed auth features.",
      );
    }

    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }

  return globalForPrisma.prisma;
}
