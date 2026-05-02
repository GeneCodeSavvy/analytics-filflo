import {
  NotificationCountResponseSchema,
  NotificationListResponseSchema,
  NotificationThreadSchema,
} from "@shared/schema";
import type { RequestHandler } from "express";
import {
  parseRequestData,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import { notificationEvents, notificationRows } from "./data";
import {
  filterNotifications,
  getNotificationById,
  NotificationListParamsRequestSchema,
  requiredParamSchema,
} from "./utils";

export const getNotifications: RequestHandler = (req, res) => {
  const params = parseRequestData(
    res,
    NotificationListParamsRequestSchema,
    req.query,
    "notification list params",
  );

  if (!params) return;

  const filteredRows = filterNotifications(notificationRows, params);
  const start = (params.page - 1) * params.pageSize;

  return sendValidatedData(
    res,
    NotificationListResponseSchema,
    {
      rows: filteredRows.slice(start, start + params.pageSize),
      total: filteredRows.length,
      page: params.page,
      pageSize: params.pageSize,
    },
    "Notification list dummy data",
  );
};

export const getNotificationCount: RequestHandler = (_req, res) => {
  return sendValidatedData(
    res,
    NotificationCountResponseSchema,
    {
      inbox: notificationRows.filter((row) => row.state === "inbox").length,
    },
    "Notification count dummy data",
  );
};

export const getNotificationThread: RequestHandler = (req, res) => {
  const params = parseRequestData(
    res,
    requiredParamSchema("id"),
    req.params,
    "notification id",
  );

  if (!params) return;

  if (!getNotificationById(params.id)) {
    return sendNotFound(res, "Notification");
  }

  return sendValidatedData(
    res,
    NotificationThreadSchema,
    {
      notificationGroupId: params.id,
      events: notificationEvents[params.id] ?? [],
    },
    "Notification thread dummy data",
  );
};
