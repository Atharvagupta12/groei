import type { WebhookEvent } from "@clerk/nextjs/server";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

type ClerkUserData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string;
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string | null;
};

function profileFrom(data: ClerkUserData) {
  const email =
    data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
    data.email_addresses?.[0]?.email_address ??
    "";
  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.username ||
    email.split("@")[0] ||
    "Groei creator";
  return { clerkId: data.id, email, name, imageUrl: data.image_url ?? "" };
}

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateRequest(request);
  if (!event) {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated":
      await ctx.runMutation(
        internal.users.upsertFromClerk,
        profileFrom(event.data as unknown as ClerkUserData)
      );
      break;
    case "user.deleted":
      if (event.data.id) {
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkId: event.data.id });
      }
      break;
  }
  return new Response(null, { status: 200 });
});

const http = httpRouter();

http.route({
  path: "/clerk",
  method: "POST",
  handler: handleClerkWebhook,
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set in the Convex environment");
    return null;
  }
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };
  try {
    return new Webhook(webhookSecret).verify(payload, headers) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Clerk webhook verification failed", error);
    return null;
  }
}

export default http;
