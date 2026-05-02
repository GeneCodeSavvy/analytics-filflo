import {
  IdParamsSchema,
  ParticipantsSchema,
  ThreadListSchema,
  ThreadSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { filterThreadRows, getThreadById, parseMessageFilters } from "./utils";

export const getThreads: RequestHandler = (req, res) => {
  const filters = parseMessageFilters(req.query);

  if (!filters.success) {
    return sendInvalidRequest(res, "message filters", filters.error.issues);
  }

  return sendValidatedData(
    res,
    ThreadListSchema,
    filterThreadRows(filters.data),
    "Thread list dummy data",
  );
};

export const getThread: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const thread = getThreadById(params.data.id);

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
    "Thread detail dummy data",
  );
};

export const getParticipants: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const thread = getThreadById(params.data.id);

  if (!thread) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    ParticipantsSchema,
    thread.participants,
    "Thread participants dummy data",
  );
};
