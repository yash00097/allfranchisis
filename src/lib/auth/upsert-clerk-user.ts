import "server-only";

import { getPrismaClient } from "@/lib/prisma";

type ClerkUserIdentity = {
  clerkId: string;
  email: string;
  name: string;
};

export async function upsertClerkUser(identity: ClerkUserIdentity) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (transaction) => {
    const matchingUsers = await transaction.user.findMany({
      where: {
        OR: [{ clerkId: identity.clerkId }, { email: identity.email }],
      },
      take: 2,
    });
    const userByClerkId = matchingUsers.find(
      (user) => user.clerkId === identity.clerkId,
    );
    const userByEmail = matchingUsers.find(
      (user) => user.email === identity.email,
    );

    if (userByClerkId && userByEmail && userByClerkId.id !== userByEmail.id) {
      await transaction.user.delete({ where: { id: userByClerkId.id } });
      return transaction.user.update({
        where: { id: userByEmail.id },
        data: {
          clerkId: identity.clerkId,
          email: identity.email,
          name: identity.name,
        },
      });
    }

    if (userByClerkId) {
      return transaction.user.update({
        where: { id: userByClerkId.id },
        data: {
          email: identity.email,
          name: identity.name,
        },
      });
    }

    if (userByEmail) {
      return transaction.user.update({
        where: { id: userByEmail.id },
        data: {
          clerkId: identity.clerkId,
          name: identity.name,
        },
      });
    }

    return transaction.user.create({ data: identity });
  });
}
