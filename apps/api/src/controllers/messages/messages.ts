import { EmptyResponseSchema } from "@shared/schema/domain";
import {
  MessageSchema,
  MessagesPageSchema,
  SendMessagePayloadSchema,
  ThreadMessageParamsSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { users } from "./data";
import {
  getThreadById,
  getThreadMessages,
  parseMessagePageParams,
} from "./utils";

export const getMessages: RequestHandler = (req, res) => {
  const params = ThreadMessageParamsSchema.safeParse(req.params);
  const page = parseMessagePageParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  if (!page.success) {
    return sendInvalidRequest(res, "message page params", page.error.issues);
  }

  if (!getThreadById(params.data.threadId)) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  const cursorIndex =
    page.data.cursor === undefined ? 0 : Number.parseInt(page.data.cursor, 10);
  const start = Number.isFinite(cursorIndex) ? cursorIndex : 0;
  const messages = getThreadMessages(params.data.threadId);
  const nextStart = start + page.data.limit;
  const pageMessages = messages.slice(start, nextStart);

  return sendValidatedData(
    res,
    MessagesPageSchema,
    {
      messages: pageMessages,
      nextCursor: nextStart < messages.length ? String(nextStart) : undefined,
    },
    "Message page dummy data",
  );
};

export const sendMessage: RequestHandler = (req, res) => {
  const params = ThreadMessageParamsSchema.safeParse(req.params);
  const body = SendMessagePayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "send message payload", body.error.issues);
  }

  if (!getThreadById(params.data.threadId)) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    MessageSchema,
    {
      id: "msg-new",
      threadId: params.data.threadId,
      kind: body.data.fileIds?.length ? "FILE_ATTACHMENT" : "USER_MESSAGE",
      sender: users.agentA,
      at: "2026-05-02T09:30:00.000Z",
      content: body.data.content ?? "",
      ticketRefs: body.data.ticketRefs,
      file: body.data.fileIds?.length
        ? {
            id: body.data.fileIds[0] ?? "file-new",
            name: "uploaded-file.pdf",
            size: 24576,
            mimeType: "application/pdf",
            url: "https://example.com/files/uploaded-file.pdf",
          }
        : undefined,
    },
    "Sent message dummy data",
  );
};

export const markMessageRead: RequestHandler = (req, res) => {
  const params = ThreadMessageParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "message read params", params.error.issues);
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Mark message read response",
  );
};

export const markThreadRead: RequestHandler = (req, res) => {
  const params = ThreadMessageParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Mark thread read response",
  );
};
