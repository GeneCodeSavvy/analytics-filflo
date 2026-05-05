import {
  CreateViewPayloadSchema,
  UpdateViewPayloadSchema,
  ViewListSchema,
  ViewSchema,
} from "@shared/schema/tickets";
import { DeleteResponseSchema } from "@shared/schema/domain";
import type { RequestHandler } from "express";
import {
  sendInvalidRequest,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  createViewInDb,
  deleteViewInDb,
  getViewsFromDb,
  updateViewInDb,
} from "./data";
import { IdParamsSchema } from "./utils";

export const getViews: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const views = await getViewsFromDb(db, req.dbUser);

  return sendValidatedData(res, ViewListSchema, views);
};

export const createView: RequestHandler = async (req, res) => {
  const body = CreateViewPayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "create view payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const ownerId = req.dbUser.id;
  const view = await createViewInDb(db, body.data, ownerId);

  return sendValidatedData(res, ViewSchema, view);
};

export const updateView: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = UpdateViewPayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "view id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "update view payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const view = await updateViewInDb(
    db,
    params.data.id,
    body.data,
    req.dbUser.id,
  );

  if (!view) {
    return sendNotFound(res, "View");
  }

  return sendValidatedData(res, ViewSchema, view);
};

export const deleteView: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "view id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const deleted = await deleteViewInDb(db, params.data.id, req.dbUser.id);

  if (!deleted) {
    return sendNotFound(res, "View");
  }

  return sendValidatedData(res, DeleteResponseSchema, { deleted: true });
};
