import type { RequestHandler } from "express";
import type { DbClient } from "./db";

export type DbUser = {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
  orgId: string;
};

declare global {
  namespace Express {
    interface Request {
      dbUser: DbUser;
    }
  }
}

export const requireDbUser: RequestHandler = async (req, res, next) => {
  const clerkUserId = (req as any).auth?.userId as string | null | undefined;

  if (!clerkUserId) {
    res.status(401).json({ success: false, error: "Unauthenticated" });
    return;
  }

  const db = req.app.locals.db as DbClient;
  const user = await db.user.findUnique({
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

  if (!user) {
    res.status(401).json({ success: false, error: "User not found" });
    return;
  }

  req.dbUser = user;
  next();
};
