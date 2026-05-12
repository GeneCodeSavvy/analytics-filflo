import {
  AssignPayloadSchema,
  BulkResultSchema,
  BulkTicketPayloadSchema,
  NewTicketDraftSchema,
  TicketDetailSchema,
  UpdateTicketPayloadSchema,
} from "@shared/schema/tickets";
import {
  DeleteResponseSchema,
  TicketPrioritySchema,
  TicketStatusSchema,
} from "@shared/schema/domain";
import createLogger from "@shared/logger";
import { TicketPriority, TicketStatus } from "@prisma/client";
import type { RequestHandler } from "express";
import {
  sendInvalidRequest,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  getTicketOrg,
  assignTicketInDb,
  bulkTicketsInDb,
  createTicketInDb,
  deleteTicketInDb,
  updateTicketInDb,
  updateTicketPriorityInDb,
  updateTicketStatusInDb,
} from "./data";
import {
  ensureBulkTicketActionAllowed,
  ensureTicketAssignable,
  ensureTicketOrgReadable,
  scopeTicketFilters,
} from "./permissions";
import { IdParamsSchema } from "./utils";

const logger = createLogger("ticketMutationsController");

const normalizeBulkTicketPayload = (body: unknown) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const payload = body as {
    action?: unknown;
    status?: unknown;
    priority?: unknown;
  };

  if (payload.action) {
    return body;
  }

  if (payload.status === TicketStatus.CLOSED) {
    return { ...payload, action: "close" };
  }

  if (payload.status) {
    return { ...payload, action: "status" };
  }

  if (payload.priority) {
    return { ...payload, action: "priority" };
  }

  return body;
};

export const createTicket: RequestHandler = async (req, res) => {
  const body = NewTicketDraftSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "create ticket payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actorId = req.dbUser.id;
  const ticket = await createTicketInDb(db, body.data, actorId);

  return sendValidatedData(res, TicketDetailSchema, ticket);
};

export const updateTicket: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = UpdateTicketPayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "update ticket payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const target = await getTicketOrg(db, params.data.id);

  if (!target) {
    return sendNotFound(res, "Ticket");
  }

  if (!ensureTicketOrgReadable(res, req.dbUser, target)) {
    return;
  }

  const actorId = req.dbUser.id;
  const ticket = await updateTicketInDb(db, params.data.id, body.data, actorId);

  if (!ticket) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, TicketDetailSchema, ticket);
};

export const deleteTicket: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const target = await getTicketOrg(db, params.data.id);

  if (!target) {
    return sendNotFound(res, "Ticket");
  }

  if (!ensureTicketOrgReadable(res, req.dbUser, target)) {
    return;
  }

  const deleted = await deleteTicketInDb(db, params.data.id);

  if (!deleted) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, DeleteResponseSchema, { deleted: true });
};

export const bulkTickets: RequestHandler = async (req, res) => {
  logger.info(`Bulk ticket request ${req.method} ${req.originalUrl}`);
  const body = BulkTicketPayloadSchema.safeParse(
    normalizeBulkTicketPayload(req.body),
  );

  if (!body.success) {
    logger.error({
      event: "invalid_bulk_ticket_payload",
      issues: body.error.issues,
    });
    return sendInvalidRequest(res, "bulk ticket payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  if (!ensureBulkTicketActionAllowed(res, req.dbUser, body.data.action)) {
    logger.error({
      event: "bulk_ticket_action_forbidden",
      action: body.data.action,
      userId: req.dbUser.id,
    });
    return;
  }

  const actorId = req.dbUser.id;
  const scoped = scopeTicketFilters(req.dbUser, {});
  logger.info(
    `Applying bulk ticket action ${body.data.action} to ${body.data.ids.length} ticket(s)`,
  );
  const result = await bulkTicketsInDb(
    db,
    body.data.ids,
    body.data.action,
    actorId,
    {
      status: body.data.status as TicketStatus | undefined,
      priority: body.data.priority as TicketPriority | undefined,
      assigneeIds: body.data.assigneeIds,
      readableOrgIds: scoped.filters.orgIds,
    },
  );

  logger.info(
    `Bulk ticket action ${body.data.action} completed: ${result.succeeded.length} succeeded, ${result.failed.length} failed`,
  );
  return sendValidatedData(res, BulkResultSchema, result);
};

export const assignTicket: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = AssignPayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "assign ticket payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  if (!ensureTicketAssignable(res, req.dbUser)) {
    return;
  }

  const target = await getTicketOrg(db, params.data.id);

  if (!target) {
    return sendNotFound(res, "Ticket");
  }

  if (!ensureTicketOrgReadable(res, req.dbUser, target)) {
    return;
  }

  const actorId = req.dbUser.id;
  const ticket = await assignTicketInDb(
    db,
    params.data.id,
    body.data.add,
    body.data.remove,
    actorId,
  );

  if (!ticket) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, TicketDetailSchema, ticket);
};

export const updateTicketStatus: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = TicketStatusSchema.safeParse(req.body?.status);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "ticket status payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const target = await getTicketOrg(db, params.data.id);

  if (!target) {
    return sendNotFound(res, "Ticket");
  }

  if (!ensureTicketOrgReadable(res, req.dbUser, target)) {
    return;
  }

  const actorId = req.dbUser.id;
  const ticket = await updateTicketStatusInDb(
    db,
    params.data.id,
    body.data as TicketStatus,
    actorId,
  );

  if (!ticket) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, TicketDetailSchema, ticket);
};

export const updateTicketPriority: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = TicketPrioritySchema.safeParse(req.body?.priority);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(
      res,
      "ticket priority payload",
      body.error.issues,
    );
  }

  const db = req.app.locals.db as DbClient;
  const target = await getTicketOrg(db, params.data.id);

  if (!target) {
    return sendNotFound(res, "Ticket");
  }

  if (!ensureTicketOrgReadable(res, req.dbUser, target)) {
    return;
  }

  const actorId = req.dbUser.id;
  const ticket = await updateTicketPriorityInDb(
    db,
    params.data.id,
    body.data as TicketPriority,
    actorId,
  );

  if (!ticket) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, TicketDetailSchema, ticket);
};
