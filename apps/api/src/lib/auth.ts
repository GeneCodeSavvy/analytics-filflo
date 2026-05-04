import type { RequestHandler } from "express";
import { clerkClient, type ExpressRequestWithAuth } from "@clerk/express";
import type { DbClient } from "./db";

export type DbUser = {
  id: string;
  clerkUserId: string | null;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
  orgId: string;
};

type ClerkUserForLinking = Awaited<
  ReturnType<typeof clerkClient.users.getUser>
>;

declare global {
  namespace Express {
    interface Request {
      dbUser: DbUser;
    }
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getPrimaryEmail = (user: ClerkUserForLinking) => {
  const primaryEmail = user.primaryEmailAddressId
    ? user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
      )
    : null;

  return primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
};

const getDisplayName = (user: ClerkUserForLinking, email: string) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || email;
};

export const reconcileDbUserForClerkId = async (
  db: DbClient,
  clerkUserId: string,
): Promise<DbUser | null> => {
  const existing = await db.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      orgId: true,
    },
  });

  if (existing) {
    return existing;
  }

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    return null;
  }

  const stubUser = await db.user.findFirst({
    where: {
      email: { equals: normalizeEmail(email), mode: "insensitive" },
      clerkUserId: null,
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!stubUser) {
    return null;
  }

  try {
    return await db.user.update({
      where: { id: stubUser.id },
      data: {
        clerkUserId,
        displayName: getDisplayName(clerkUser, email),
        ...(clerkUser.imageUrl ? { avatarUrl: clerkUser.imageUrl } : {}),
      },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        orgId: true,
      },
    });
  } catch {
    return db.user.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        orgId: true,
      },
    });
  }
};

export const requireDbUser: RequestHandler = async (req, res, next) => {
  const clerkUserId = (req as ExpressRequestWithAuth).auth().userId;

  if (!clerkUserId) {
    res.status(401).json({ success: false, error: "Unauthenticated" });
    return;
  }

  const db = req.app.locals.db as DbClient;

  let user: DbUser | null;
  try {
    user = await reconcileDbUserForClerkId(db, clerkUserId);
  } catch {
    res.status(500).json({ success: false, error: "Internal error" });
    return;
  }

  if (!user) {
    res.status(401).json({ success: false, error: "User not found" });
    return;
  }

  req.dbUser = user;
  next();
};
