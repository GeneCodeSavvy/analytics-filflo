import {
  EmptyResponseSchema,
  IdParamsSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { getThreadById } from "./utils";

export const joinThread: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "thread id", params.error.issues);
  }

  if (!getThreadById(params.data.id)) {
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
