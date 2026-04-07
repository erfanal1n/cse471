import { PrismaClient } from "@/generated/prisma/index.js";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Dev cache guard
function hasProductDelegate(client: PrismaClient) {
  return typeof client.product !== "undefined";
}

export const prisma =
  globalForPrisma.prisma && hasProductDelegate(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
