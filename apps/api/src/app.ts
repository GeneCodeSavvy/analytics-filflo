import express from "express";
import cors, { CorsOptions } from "cors";
import dashboardRouter from "./routes/dashboard";
import messageRouter from "./routes/messages";
import notificationsRouter from "./routes/notifications";
import teamsRouter from "./routes/teams";
import ticketsRouter from "./routes/tickets";
import type { DbClient } from "./lib/db";

const corsOptions: CorsOptions = {
  origin: process.env.CORS_URLS || "http://localhost:5173",
  credentials: true,
};

export const createApp = (db: DbClient): express.Application => {
  const app = express();
  app.use(express.json());
  app.use(cors(corsOptions));
  app.locals.db = db;

  app.use("/dashboard", dashboardRouter);
  app.use("/tickets", ticketsRouter);
  app.use("/teams", teamsRouter);
  app.use("/threads", messageRouter);
  app.use("/notifications", notificationsRouter);

  return app;
};
