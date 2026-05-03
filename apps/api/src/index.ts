import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });
import http from "http";
import { WebSocketServer } from "ws";
import { createDbClient } from "./lib/db";
import { setupMessageWebSocket } from "./lib/ws";
import { createApp } from "./app";

const PORT = process.env.PORT || 3000;
const DB_CONNECTION_STRING = process.env.DATABASE_URL;

if (!DB_CONNECTION_STRING) {
  console.error("DATABASE_URL not provided in the .env");
  process.exit(1);
}

const db = createDbClient(DB_CONNECTION_STRING);
const app = createApp(db);

const server = http.createServer(app);
export const wss = new WebSocketServer({ server });
setupMessageWebSocket(wss);

server.listen(PORT, () => {
  console.log(`API + WS running on http://localhost:${PORT}`);
});
