import { Router, type Request, type Response } from "express";
import { Webhook } from "svix";
import type { DbClient } from "../lib/db";
import { syncClerkPublicMetadata } from "../lib/auth";

const webhooksRouter: Router = Router();

webhooksRouter.post("/clerk", async (req: Request, res: Response) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  const wh = new Webhook(secret);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(req.body as Buffer, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof evt;
  } catch {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  if (evt.type !== "user.created") {
    res.status(200).json({ received: true });
    return;
  }

  const data = evt.data as {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url?: string | null;
  };

  const email = data.email_addresses[0]?.email_address?.trim();

  if (!email) {
    res.status(200).json({ received: true });
    return;
  }

  const db = req.app.locals.db as DbClient;

  try {
    const stubUser = await db.user.findFirst({
      where: {
        email: { equals: email.toLowerCase(), mode: "insensitive" },
        clerkUserId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!stubUser) {
      console.warn(`[webhook] user.created for ${email} — no stub user found (organic sign-up?)`);
      res.status(200).json({ received: true });
      return;
    }

    const firstName = data.first_name ?? "";
    const lastName = data.last_name ?? "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || email;

    const linkedUser = await db.user.update({
      where: { id: stubUser.id },
      data: {
        clerkUserId: data.id,
        displayName,
        ...(data.image_url ? { avatarUrl: data.image_url } : {}),
      },
    });

    await syncClerkPublicMetadata(data.id, linkedUser);
  } catch {
    console.error(`[webhook] DB error processing user.created for ${email}`);
    res.status(500).json({ error: "Internal error" });
    return;
  }

  res.status(200).json({ received: true });
});

export default webhooksRouter;
