import { EmptyResponseSchema, IdParamsSchema } from "@shared/schema/domain";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { joinThread as joinThreadMutation } from "./data";

export const joinThread: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  const joined = await joinThreadMutation(db, params.data.id);

  if (!joined) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Join thread response",
  );
};
