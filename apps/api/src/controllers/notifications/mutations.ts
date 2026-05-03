import {
  BulkNotificationPayloadSchema,
  InvitationResponsePayloadSchema,
  NotificationStateSchema,
} from "@shared/schema/notifications";
import { EmptyResponseSchema } from "@shared/schema/domain";
import type { RequestHandler } from "express";
import { parseRequestData, sendNotFound, sendOk } from "../../lib/controllers";
import { getNotificationById, requiredParamSchema } from "./utils";

const notificationIdSchema = requiredParamSchema("id");
const invitationIdSchema = requiredParamSchema("invitationId");
const ticketIdSchema = requiredParamSchema("ticketId");

const ensureNotification = (id: string, res: Parameters<RequestHandler>[1]) => {
  if (!getNotificationById(id)) {
    sendNotFound(res, "Notification");
    return false;
  }

  return true;
};

export const updateNotificationState: RequestHandler = (req, res) => {
  const params = parseRequestData(
    res,
    notificationIdSchema,
    req.params,
    "notification id",
  );
  const state = parseRequestData(
    res,
    NotificationStateSchema,
    req.body?.state,
    "notification state payload",
  );

  if (!params || !state || !ensureNotification(params.id, res)) return;

  return sendOk(res, EmptyResponseSchema, "Notification state update response");
};

export const snoozeNotification: RequestHandler = (req, res) => {
  const params = parseRequestData(
    res,
    notificationIdSchema,
    req.params,
    "notification id",
  );

  if (!params || !ensureNotification(params.id, res)) return;

  return sendOk(res, EmptyResponseSchema, "Notification snooze response");
};

export const bulkNotifications: RequestHandler = (req, res) => {
  const body = parseRequestData(
    res,
    BulkNotificationPayloadSchema,
    req.body,
    "bulk notification payload",
  );

  if (!body) return;

  return sendOk(res, EmptyResponseSchema, "Bulk notification response");
};

export const respondToInvitation: RequestHandler = (req, res) => {
  const params = parseRequestData(
    res,
    invitationIdSchema,
    req.params,
    "invitation id",
  );
  const body = parseRequestData(
    res,
    InvitationResponsePayloadSchema,
    req.body,
    "invitation response payload",
  );

  if (!params || !body) return;

  return sendOk(res, EmptyResponseSchema, "Invitation response");
};

export const muteTicket: RequestHandler = (req, res) => {
  const body = parseRequestData(
    res,
    ticketIdSchema,
    req.body,
    "mute ticket payload",
  );

  if (!body) return;

  return sendOk(res, EmptyResponseSchema, "Mute ticket response");
};

export const unmuteTicket: RequestHandler = (req, res) => {
  const params = parseRequestData(res, ticketIdSchema, req.params, "ticket id");

  if (!params) return;

  return sendOk(res, EmptyResponseSchema, "Unmute ticket response");
};
