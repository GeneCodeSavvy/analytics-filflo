import {
  CreateViewPayloadSchema,
  UpdateViewPayloadSchema,
  ViewListSchema,
  ViewSchema,
} from "@shared/schema/tickets";
import { DeleteResponseSchema } from "@shared/schema/domain";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { views } from "./data";
import { IdParamsSchema } from "./utils";

export const getViews: RequestHandler = (_req, res) => {
  return sendValidatedData(res, ViewListSchema, views, "Ticket views");
};

export const createView: RequestHandler = (req, res) => {
  const body = CreateViewPayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "create view payload", body.error.issues);
  }

  return sendValidatedData(
    res,
    ViewSchema,
    {
      id: "view-new",
      scope: "user",
      ownerId: "usr-201",
      ...body.data,
    },
    "Created view",
  );
};

export const updateView: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = UpdateViewPayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "view id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "update view payload", body.error.issues);
  }

  return sendValidatedData(
    res,
    ViewSchema,
    {
      ...views[1],
      id: params.data.id,
      ...body.data,
    },
    "Updated view",
  );
};

export const deleteView: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "view id", params.error.issues);
  }

  return sendValidatedData(
    res,
    DeleteResponseSchema,
    { deleted: true },
    "Delete view response",
  );
};
