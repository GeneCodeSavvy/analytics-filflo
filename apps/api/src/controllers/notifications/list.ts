import {
  NotificationCountResponseSchema,
  NotificationListResponseSchema,
  NotificationThreadSchema,
} from "@shared/schema/notifications";
import type { RequestHandler } from "express";
import {
  parseRequestData,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  getNotificationCount as fetchNotificationCount,
  getNotificationList as fetchNotificationList,
  getNotificationThread as fetchNotificationThread,
} from "./data";
import { NotificationListParamsRequestSchema, requiredParamSchema } from "./utils";

export const getNotifications: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = parseRequestData(
    res,
    NotificationListParamsRequestSchema,
    req.query,
    "notification list params",
  );

  if (!params) return;

  const notifications = await fetchNotificationList(db, params);

  return sendValidatedData(
    res,
    NotificationListResponseSchema,
    notifications,
    "Notification list data",
  );
};

export const getNotificationCount: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const count = await fetchNotificationCount(db);

  return sendValidatedData(
    res,
    NotificationCountResponseSchema,
    count,
    "Notification count data",
  );
};

export const getNotificationThread: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = parseRequestData(
    res,
    requiredParamSchema("id"),
    req.params,
    "notification id",
  );

  if (!params) return;

  const thread = await fetchNotificationThread(db, params.id);

  if (!thread) {
    return sendNotFound(res, "Notification");
  }

  return sendValidatedData(
    res,
    NotificationThreadSchema,
    thread,
    "Notification thread data",
  );
};
