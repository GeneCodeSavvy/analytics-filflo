import { EmptyResponseSchema } from "@shared/schema/domain";
import {
  FileUploadResponseSchema,
  ThreadFileParamsSchema,
} from "@shared/schema/messages";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { getThreadById } from "./utils";

export const uploadFile: RequestHandler = (req, res) => {
  const params = ThreadFileParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "file upload params", params.error.issues);
  }

  if (!getThreadById(params.data.threadId)) {
    return res.status(404).json({
      success: false,
      error: "Thread not found",
    });
  }

  return sendValidatedData(
    res,
    FileUploadResponseSchema,
    {
      fileId: "file-new",
      url: "https://example.com/files/file-new",
      thumbnailUrl: "https://example.com/files/file-new-thumb",
    },
    "File upload dummy data",
  );
};

export const deleteFile: RequestHandler = (req, res) => {
  const params = ThreadFileParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "file delete params", params.error.issues);
  }

  return sendValidatedData(
    res,
    EmptyResponseSchema,
    { ok: true },
    "Delete file response",
  );
};
