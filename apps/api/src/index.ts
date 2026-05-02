import http from "http";
import express from "express";
import cors, { CorsOptions } from "cors";
import { WebSocketServer } from "ws";
import dashboardRouter from "./routes/dashboard";
import messageRouter from "./routes/messages";
import ticketsRouter from "./routes/tickets";
import { setupMessageWebSocket } from "./ws";

const PORT = process.env.PORT || 3000;
const corsOptions: CorsOptions = {
  origin: process.env.CORS_URLS || "http://localhost:5173",
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

const server = http.createServer(app);
export const wss = new WebSocketServer({ server });
setupMessageWebSocket(wss);

app.use("/dashboard", dashboardRouter);
app.use("/tickets", ticketsRouter);
app.use("/threads", messageRouter);

server.listen(PORT, () => {
  console.log(`API + WS running on http://localhost:${PORT}`);
});
