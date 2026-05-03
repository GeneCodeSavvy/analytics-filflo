import { ThreadMessageParamsSchema } from "@shared/schema/messages";
import type { IncomingMessage } from "http";
import type { WebSocketServer } from "ws";

const parseThreadId = (request: IncomingMessage) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const match = /^\/threads\/([^/]+)\/ws$/.exec(url.pathname);

  if (!match) {
    return ThreadMessageParamsSchema.safeParse({ threadId: "" });
  }

  return ThreadMessageParamsSchema.safeParse({ threadId: match[1] });
};

export const setupMessageWebSocket = (wss: WebSocketServer) => {
  wss.on("connection", (socket, request) => {
    const params = parseThreadId(request);

    if (!params.success) {
      socket.close(1008, "Invalid thread websocket path");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "thread_connected",
        threadId: params.data.threadId,
        at: `${new Date().toISOString()}`,
      }),
    );
  });
};
