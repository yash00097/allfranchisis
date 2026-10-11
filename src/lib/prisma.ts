import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// node-postgres does not implement SCRAM channel binding, so the libpq
// `channel_binding` param must be stripped before `pg` parses the URL.
const stripChannelBinding = (url: string) =>
  url.replace(/([?&])channel_binding=require(&?)/, (_, prefix, separator) =>
    prefix === "?" && separator ? "?" : "",
  );

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    // Prefer the pooled (PgBouncer) endpoint. The direct Neon endpoint drops
    // idle TCP sessions when compute suspends; a cached `pg` client then fails
    // with "Server has closed the connection" on reuse.
    const rawConnectionString =
      process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;

    if (!rawConnectionString) {
      throw new Error(
        "DATABASE_URL is required for database-backed auth features.",
      );
    }

    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: stripChannelBinding(rawConnectionString),
        // Evict idle clients before Neon can close them server-side.
        idleTimeoutMillis: 30_000,
      }),
    });
  }

  return globalForPrisma.prisma;
}
