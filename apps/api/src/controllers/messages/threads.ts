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
  getThreadById,
  getThreadList,
  getThreadParticipants,
} from "./data";
import { parseMessageFilters } from "./utils";

export const getThreads: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseMessageFilters(req.query);

  if (!filters.success) {
    return sendInvalidRequest(res, "message filters", filters.error.issues);
  }

  const threads = await getThreadList(db, filters.data);

  return sendValidatedData(
    res,
    ThreadListSchema,
    threads,
    "Thread list data",
  );
};

export const getThread: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const thread = await getThreadById(db, params.data.id);

  if (!thread) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    ThreadSchema,
    thread,
    "Thread detail data",
  );
};

export const getParticipants: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
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
