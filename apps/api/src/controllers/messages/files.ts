import { EmptyResponseSchema } from "@shared/schema/domain";
import {
  FileUploadResponseSchema,
  ThreadFileParamsSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  createFileUploadResponse,
  deleteThreadFile,
  getThreadAccessTarget,
} from "./data";
import { ensureThreadWritable } from "./permissions";

export const uploadFile: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = ThreadFileParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "file upload params", params.error.issues);
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

  const file = await createFileUploadResponse(
    db,
    params.data.threadId,
    req.dbUser.id,
  );

  if (!file) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    FileUploadResponseSchema,
    file,
    "File upload data",
  );
};

export const deleteFile: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = ThreadFileParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "file delete params", params.error.issues);
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

  const deleted = await deleteThreadFile(
    db,
    params.data.threadId,
    params.data.fileId,
  );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "File not found",
    });
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Delete file response",
  );
};
