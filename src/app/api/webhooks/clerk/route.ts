import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET in environment variables.");
    return new Response("Missing CLERK_WEBHOOK_SECRET in environment variables.", {
      status: 500,
    });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const body = JSON.stringify(payload);

  // Create a new Svix instance with the secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Verification failed", {
      status: 400,
    });
  }

  const eventType = evt.type;
  console.log(`Clerk webhook received: ${eventType}`);

  if (eventType === "user.deleted") {
    const { id: clerkUserId } = evt.data;
    if (clerkUserId) {
      try {
        // Delete the user from local database. Due to Cascade onDelete, this will instantly clean up all user data!
        await prisma.user.delete({
          where: { clerkUserId },
        });
        console.log(`User with Clerk ID ${clerkUserId} and all their assets, transactions, and settings have been permanently deleted via Webhook.`);
      } catch (err: any) {
        console.error(`Error deleting user ${clerkUserId} from database:`, err);
        // Return 200/204 even on error if user was already deleted to prevent webhook retries,
        // but log it for administrators.
      }
    }
  }

  return new Response("Webhook processed", { status: 200 });
}
