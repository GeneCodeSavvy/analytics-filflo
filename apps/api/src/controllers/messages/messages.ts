import { EmptyResponseSchema } from "@shared/schema/domain";
import {
  MessageSchema,
  MessagesPageSchema,
  SendMessagePayloadSchema,
  ThreadMessageParamsSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  createThreadMessage,
  getThreadAccessTarget,
  getThreadMessages,
  markMessageRead as markMessageReadState,
} from "./data";
import { ensureThreadReadable, ensureThreadWritable } from "./permissions";
import { parseMessagePageParams } from "./utils";

export const getMessages: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = ThreadMessageParamsSchema.safeParse(req.params);
  const page = parseMessagePageParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  if (!page.success) {
    return sendInvalidRequest(res, "message page params", page.error.issues);
  }

  const target = await getThreadAccessTarget(db, params.data.threadId);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  if (!ensureThreadReadable(res, req.dbUser, target)) {
    return;
  }

  const pageData = await getThreadMessages(db, params.data.threadId, page.data);

  if (!pageData) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    MessagesPageSchema,
    pageData,
    "Message page data",
  );
};

export const sendMessage: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = ThreadMessageParamsSchema.safeParse(req.params);
  const body = SendMessagePayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "send message payload", body.error.issues);
  }

  const target = await getThreadAccessTarget(db, params.data.threadId);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  if (!ensureThreadWritable(res, req.dbUser, target)) {
    return;
  }

  const message = await createThreadMessage(
    db,
    params.data.threadId,
    body.data,
    req.dbUser.id,
  );

  if (!message) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(res, MessageSchema, message, "Sent message data");
};

export const markMessageRead: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = ThreadMessageParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "message read params", params.error.issues);
  }

  const target = await getThreadAccessTarget(db, params.data.threadId);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  if (!ensureThreadReadable(res, req.dbUser, target)) {
    return;
  }

  const marked = await markMessageReadState(
    db,
    params.data.threadId,
    req.dbUser.id,
    params.data.messageId,
  );

  if (!marked) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Mark message read response",
  );
};

export const markThreadRead: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = ThreadMessageParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const target = await getThreadAccessTarget(db, params.data.threadId);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  if (!ensureThreadReadable(res, req.dbUser, target)) {
    return;
  }

  const marked = await markMessageReadState(
    db,
    params.data.threadId,
    req.dbUser.id,
  );

  if (!marked) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Mark thread read response",
  );
};
