import "dotenv/config";
import http from "http";
import express from "express";
import cors, { CorsOptions } from "cors";
import { WebSocketServer } from "ws";
import dashboardRouter from "./routes/dashboard";
import messageRouter from "./routes/messages";
import notificationsRouter from "./routes/notifications";
import teamsRouter from "./routes/teams";
import ticketsRouter from "./routes/tickets";
import { createDbClient } from "./lib/db";
import { setupMessageWebSocket } from "./lib/ws";

const PORT = process.env.PORT || 3000;
const DB_CONNECTION_STRING = process.env.DATABASE_URL;

const corsOptions: CorsOptions = {
  origin: process.env.CORS_URLS || "http://localhost:5173",
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
if (DB_CONNECTION_STRING) {
  app.locals.db = createDbClient(DB_CONNECTION_STRING);
} else {
  console.error("DATABASE_URL not provided in the .env");
}

const server = http.createServer(app);
export const wss = new WebSocketServer({ server });
setupMessageWebSocket(wss);

app.use("/dashboard", dashboardRouter);
app.use("/tickets", ticketsRouter);
app.use("/teams", teamsRouter);
app.use("/threads", messageRouter);
app.use("/notifications", notificationsRouter);

server.listen(PORT, () => {
  console.log(`API + WS running on http://localhost:${PORT}`);
});
