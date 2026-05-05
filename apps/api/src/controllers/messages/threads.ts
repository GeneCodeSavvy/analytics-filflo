import { IdParamsSchema } from "@shared/schema/domain";
import {
  ParticipantsSchema,
  ThreadListSchema,
  ThreadSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  getThreadAccessTarget,
  getThreadById,
  getThreadList,
  getThreadParticipants,
} from "./data";
import { ensureThreadReadable, scopeMessageFilters } from "./permissions";
import { parseMessageFilters } from "./utils";

export const getThreads: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseMessageFilters(req.query);

  if (!filters.success) {
    return sendInvalidRequest(res, "message filters", filters.error.issues);
  }

  const scoped = scopeMessageFilters(req.dbUser, filters.data);

  if (!scoped.allowed) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const threads = await getThreadList(db, scoped.filters, req.dbUser);

  return sendValidatedData(res, ThreadListSchema, threads, "Thread list data");
};

export const getThread: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const target = await getThreadAccessTarget(db, params.data.id);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  if (!ensureThreadReadable(res, req.dbUser, target)) {
    return;
  }

  const thread = await getThreadById(db, params.data.id);

  if (!thread) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(res, ThreadSchema, thread, "Thread detail data");
};

export const getParticipants: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const target = await getThreadAccessTarget(db, params.data.id);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  if (!ensureThreadReadable(res, req.dbUser, target)) {
    return;
  }

  const participants = await getThreadParticipants(db, params.data.id);

  if (!participants) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    ParticipantsSchema,
    participants,
    "Thread participants data",
  );
};
