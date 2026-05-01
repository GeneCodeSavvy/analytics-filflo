import http from "http";
import express from "express";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

const server = http.createServer(app);

export const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
});

server.listen(PORT, () => {
  console.log(`API + WS running on http://localhost:${PORT}`);
});
