import { ThreadMessageParamsSchema } from "@shared/schema/messages";
import type { Message } from "@shared/schema/messages";
import { authenticateRequest, clerkClient } from "@clerk/express";
import type { Request } from "express";
import type { IncomingMessage } from "http";
import WebSocket, { type WebSocketServer } from "ws";
import { reconcileDbUserForClerkId } from "./auth";
import type { DbClient } from "./db";
import { getThreadAccessTarget } from "../controllers/messages/data";
import { canReadThreadTarget } from "../controllers/messages/permissions";

const subscribers = new Map<string, Set<WebSocket>>();

const parseThreadId = (request: IncomingMessage) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const match = /^\/threads\/([^/]+)\/ws$/.exec(url.pathname);

  if (!match) {
    return ThreadMessageParamsSchema.safeParse({ threadId: "" });
  }

  return ThreadMessageParamsSchema.safeParse({ threadId: match[1] });
};

const getSocketAuthToken = (request: IncomingMessage) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  return url.searchParams.get("token");
};

const applySocketAuthHeader = (request: IncomingMessage) => {
  const token = getSocketAuthToken(request);
  if (token) {
    request.headers.authorization = `Bearer ${token}`;
  }
};

const closeWithPolicy = (socket: WebSocket, reason: string) => {
  socket.close(1008, reason);
};

const authenticateSocketUser = async (
  db: DbClient,
  request: IncomingMessage,
) => {
  applySocketAuthHeader(request);

  const requestState = await authenticateRequest({
    clerkClient,
    request: request as Request,
    options: {
      secretKey: process.env.CLERK_SECRET_KEY,
    },
  });
  const clerkUserId = requestState.toAuth()?.userId;

  if (!clerkUserId) {
    return null;
  }

  return reconcileDbUserForClerkId(db, clerkUserId);
};

const subscribeToThread = (threadId: string, socket: WebSocket) => {
  const threadSubscribers = subscribers.get(threadId) ?? new Set<WebSocket>();
  threadSubscribers.add(socket);
  subscribers.set(threadId, threadSubscribers);

  socket.once("close", () => {
    threadSubscribers.delete(socket);
    if (threadSubscribers.size === 0) {
      subscribers.delete(threadId);
    }
  });
};

export const broadcastMessageToThread = (threadId: string, message: Message) => {
  const threadSubscribers = subscribers.get(threadId);

  if (!threadSubscribers) {
    return;
  }

  const payload = JSON.stringify({
    type: "new_message",
    message,
  });

  for (const socket of threadSubscribers) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
};

export const setupMessageWebSocket = (wss: WebSocketServer, db: DbClient) => {
  wss.on("connection", async (socket, request) => {
    const params = parseThreadId(request);

    if (!params.success) {
      closeWithPolicy(socket, "Invalid thread websocket path");
      return;
    }

    let user;
    try {
      user = await authenticateSocketUser(db, request);
    } catch {
      closeWithPolicy(socket, "Unauthenticated");
      return;
    }

    if (!user) {
      closeWithPolicy(socket, "Unauthenticated");
      return;
    }

    const target = await getThreadAccessTarget(db, params.data.threadId);

    if (!target) {
      closeWithPolicy(socket, "Thread not found");
      return;
    }

    if (!canReadThreadTarget(user, target)) {
      closeWithPolicy(socket, "Forbidden");
      return;
    }

    subscribeToThread(params.data.threadId, socket);

    socket.send(
      JSON.stringify({
        type: "thread_connected",
        threadId: params.data.threadId,
        at: `${new Date().toISOString()}`,
      }),
    );
  });
};
