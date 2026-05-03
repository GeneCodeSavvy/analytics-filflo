import {
  BulkNotificationPayloadSchema,
  InvitationResponsePayloadSchema,
  NotificationStateSchema,
} from "@shared/schema/notifications";
import { EmptyResponseSchema } from "@shared/schema/domain";
import type { RequestHandler } from "express";
import { parseRequestData, sendNotFound, sendOk } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  bulkNotifications as mutateBulkNotifications,
  muteTicket as muteTicketRecord,
  respondToInvitation as respondToInvitationRecord,
  snoozeNotification as snoozeNotificationRecord,
  unmuteTicket as unmuteTicketRecord,
  updateNotificationState as updateNotificationStateRecord,
} from "./data";
import { requiredParamSchema } from "./utils";

const notificationIdSchema = requiredParamSchema("id");
const invitationIdSchema = requiredParamSchema("invitationId");
const ticketIdSchema = requiredParamSchema("ticketId");

export const updateNotificationState: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
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

  if (!params || !state) return;

  const updated = await updateNotificationStateRecord(db, params.id, state);

  if (!updated) {
    return sendNotFound(res, "Notification");
  }

  return sendOk(res, EmptyResponseSchema, "Notification state update response");
};

export const snoozeNotification: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = parseRequestData(
    res,
    notificationIdSchema,
    req.params,
    "notification id",
  );

  if (!params) return;

  const snoozed = await snoozeNotificationRecord(db, params.id);

  if (!snoozed) {
    return sendNotFound(res, "Notification");
  }

  return sendOk(res, EmptyResponseSchema, "Notification snooze response");
};

export const bulkNotifications: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const body = parseRequestData(
    res,
    BulkNotificationPayloadSchema,
    req.body,
    "bulk notification payload",
  );

  if (!body) return;

  await mutateBulkNotifications(db, body);

  return sendOk(res, EmptyResponseSchema, "Bulk notification response");
};

export const respondToInvitation: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
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

  const updated = await respondToInvitationRecord(
    db,
    params.invitationId,
    body.response,
  );

  if (!updated) {
    return sendNotFound(res, "Invitation");
  }

  return sendOk(res, EmptyResponseSchema, "Invitation response");
};

export const muteTicket: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const body = parseRequestData(
    res,
    ticketIdSchema,
    req.body,
    "mute ticket payload",
  );

  if (!body) return;

  const muted = await muteTicketRecord(db, body.ticketId);

  if (!muted) {
    return sendNotFound(res, "Ticket");
  }

  return sendOk(res, EmptyResponseSchema, "Mute ticket response");
};

export const unmuteTicket: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const params = parseRequestData(res, ticketIdSchema, req.params, "ticket id");

  if (!params) return;

  const unmuted = await unmuteTicketRecord(db, params.ticketId);

  if (!unmuted) {
    return sendNotFound(res, "Ticket");
  }

  return sendOk(res, EmptyResponseSchema, "Unmute ticket response");
};
