import { verifyWebhook } from "@clerk/nextjs/webhooks";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

function getUserName(user: {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}) {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    "Clerk user"
  );
}

function getPrimaryEmail(user: {
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id: string | null;
}) {
  return user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  )?.email_address;
}

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    Sentry.captureException(error);
    console.error("Clerk webhook verification failed", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const prisma = getPrismaClient();

  if (event.type === "user.deleted") {
    if (event.data.id) {
      await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
    }

    return new Response("OK");
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const email = getPrimaryEmail(event.data);

    if (!email) {
      return new Response("Clerk user has no primary email", { status: 422 });
    }

    await prisma.user.upsert({
      where: { clerkId: event.data.id },
      update: {
        email,
        name: getUserName(event.data),
      },
      create: {
        clerkId: event.data.id,
        email,
        name: getUserName(event.data),
      },
    });
  }

  return new Response("OK");
}
