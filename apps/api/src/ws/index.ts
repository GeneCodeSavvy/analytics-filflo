import { wss } from "../index";

wss.on("connection", () => {
  console.log("WebSocket client connected");
});
