import type { RequestHandler } from "express";
import { clerkClient, type ExpressRequestWithAuth } from "@clerk/express";
import type { DbClient } from "./db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import createLogger from "@shared/logger";

export type DbUser = {
  id: string;
  clerkUserId: string | null;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
  orgId: string;
};

const dbUserSelect = {
  id: true,
  clerkUserId: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  orgId: true,
} as const;

const logger = createLogger("auth");

const getErrorData = (error: unknown) => {
  if (error instanceof PrismaClientKnownRequestError) {
    return {
      code: error.code,
      message: error.message,
      name: error.name,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return { error };
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

export const syncClerkPublicMetadata = async (
  clerkUserId: string,
  user: Pick<DbUser, "id" | "role" | "orgId">,
) => {
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      appUserId: user.id,
      role: user.role,
      orgId: user.orgId,
    },
  });
};

export const reconcileDbUserForClerkId = async (
  db: DbClient,
  clerkUserId: string,
): Promise<DbUser | null> => {
  let existing: DbUser | null;
  try {
    existing = await db.user.findUnique({
      where: { clerkUserId },
      select: dbUserSelect,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      logger.error({
        clerkUserId,
        ...getErrorData(error),
      });
    }

    throw error;
  }

  if (existing) {
    await syncClerkPublicMetadata(clerkUserId, existing);
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
    const linkedUser = await db.user.update({
      where: { id: stubUser.id },
      data: {
        clerkUserId,
        displayName: getDisplayName(clerkUser, email),
        ...(clerkUser.imageUrl ? { avatarUrl: clerkUser.imageUrl } : {}),
      },
      select: dbUserSelect,
    });

    await syncClerkPublicMetadata(clerkUserId, linkedUser);

    return linkedUser;
  } catch {
    const linkedUser = await db.user.findUnique({
      where: { clerkUserId },
      select: dbUserSelect,
    });

    if (linkedUser) {
      await syncClerkPublicMetadata(clerkUserId, linkedUser);
    }

    return linkedUser;
  }
};

export const requireDbUser: RequestHandler = async (req, res, next) => {
  try {
    const clerkUserId = (req as ExpressRequestWithAuth).auth().userId;

    if (!clerkUserId) {
      res.status(401).json({ success: false, error: "Unauthenticated" });
      return;
    }

    const db = req.app.locals.db as DbClient;
    const user = await reconcileDbUserForClerkId(db, clerkUserId);

    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }

    req.dbUser = user;
    next();
  } catch (error) {
    logger.error(getErrorData(error));
    res.status(500).json({ success: false, error: "Internal error" });
  }
};
