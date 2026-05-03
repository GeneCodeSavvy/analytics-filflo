import express from "express";
import cors, { CorsOptions } from "cors";
import { clerkMiddleware } from "@clerk/express";
import dashboardRouter from "./routes/dashboard";
import messageRouter from "./routes/messages";
import notificationsRouter from "./routes/notifications";
import teamsRouter from "./routes/teams";
import ticketsRouter from "./routes/tickets";
import invitationsRouter from "./routes/invitations";
import webhooksRouter from "./routes/webhooks";
import type { DbClient } from "./lib/db";
import { requireDbUser } from "./lib/auth";

const corsOptions: CorsOptions = {
  origin: process.env.CORS_URLS || "http://localhost:5173",
  credentials: true,
};

export const createApp = (db: DbClient): express.Application => {
  const app = express();
  app.use(express.json());
  app.use(cors(corsOptions));
  app.locals.db = db;

  app.use(clerkMiddleware());

  // Public routes (no authentication required)
  app.use("/invitations", invitationsRouter);
  app.use("/webhooks", webhooksRouter);

  // Protected routes (authentication required)
  app.use(requireDbUser);

  app.use("/dashboard", dashboardRouter);
  app.use("/tickets", ticketsRouter);
  app.use("/teams", teamsRouter);
  app.use("/threads", messageRouter);
  app.use("/notifications", notificationsRouter);

  return app;
};
