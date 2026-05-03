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
import { TicketPriority, TicketStatus } from "@prisma/client";
import type { RequestHandler } from "express";
import {
  sendInvalidRequest,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  assignTicketInDb,
  bulkTicketsInDb,
  createTicketInDb,
  deleteTicketInDb,
  updateTicketInDb,
  updateTicketPriorityInDb,
  updateTicketStatusInDb,
} from "./data";
import { IdParamsSchema } from "./utils";

// TODO: replace with authenticated user id from session middleware
const getActorId = async (db: DbClient): Promise<string> => {
  const user = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  return user!.id;
};

export const createTicket: RequestHandler = async (req, res) => {
  const body = NewTicketDraftSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "create ticket payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actorId = await getActorId(db);
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
  const actorId = await getActorId(db);
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
  const deleted = await deleteTicketInDb(db, params.data.id);

  if (!deleted) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, DeleteResponseSchema, { deleted: true });
};

export const bulkTickets: RequestHandler = async (req, res) => {
  const body = BulkTicketPayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "bulk ticket payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actorId = await getActorId(db);
  const result = await bulkTicketsInDb(db, body.data.ids, body.data.action, actorId, {
    status: body.data.status as TicketStatus | undefined,
    priority: body.data.priority as TicketPriority | undefined,
    assigneeIds: body.data.assigneeIds,
  });

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
  const actorId = await getActorId(db);
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
  const actorId = await getActorId(db);
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
    return sendInvalidRequest(res, "ticket priority payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actorId = await getActorId(db);
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
