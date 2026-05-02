import {
  AssignPayloadSchema,
  BulkResultSchema,
  BulkTicketPayloadSchema,
  DeleteResponseSchema,
  NewTicketDraftSchema,
  TicketDetailSchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  UpdateTicketPayloadSchema,
} from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { people, ticketDetails } from "./data";
import { getTicketById, IdParamsSchema } from "./utils";

const cloneTicket = (id: string) => getTicketById(id) ?? ticketDetails[0]!;

export const createTicket: RequestHandler = (req, res) => {
  const body = NewTicketDraftSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "create ticket payload", body.error.issues);
  }

  const ticket = {
    ...ticketDetails[0],
    id: "TCK-NEW",
    subject: body.data.subject,
    descriptionPreview: body.data.description.slice(0, 120),
    description: body.data.description,
    priority: body.data.priority ?? "MEDIUM",
    category: body.data.category,
    requester: people.requesterA,
    createdAt: "2026-05-02T09:00:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
    activity: [
      {
        id: "act-new-1",
        type: "created",
        actor: people.requesterA,
        comment: "Ticket created from API dummy controller.",
        createdAt: "2026-05-02T09:00:00.000Z",
      },
    ],
  };

  return sendValidatedData(res, TicketDetailSchema, ticket, "Created ticket");
};

export const updateTicket: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = UpdateTicketPayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "update ticket payload", body.error.issues);
  }

  const base = cloneTicket(params.data.id);
  const ticket = {
    ...base,
    ...body.data,
    descriptionPreview: body.data.description
      ? body.data.description.slice(0, 120)
      : base.descriptionPreview,
    updatedAt: "2026-05-02T10:00:00.000Z",
    activity: [
      ...base.activity,
      {
        id: "act-update-1",
        type: "updated",
        actor: people.agentA,
        comment: "Ticket fields updated.",
        createdAt: "2026-05-02T10:00:00.000Z",
      },
    ],
  };

  return sendValidatedData(res, TicketDetailSchema, ticket, "Updated ticket");
};

export const deleteTicket: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  return sendValidatedData(
    res,
    DeleteResponseSchema,
    { deleted: true },
    "Delete ticket response",
  );
};

export const bulkTickets: RequestHandler = (req, res) => {
  const body = BulkTicketPayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "bulk ticket payload", body.error.issues);
  }

  return sendValidatedData(
    res,
    BulkResultSchema,
    {
      succeeded: body.data.ids,
      failed: [],
    },
    "Bulk ticket result",
  );
};

export const assignTicket: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = AssignPayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "assign ticket payload", body.error.issues);
  }

  const base = cloneTicket(params.data.id);
  const ticket = {
    ...base,
    primaryAssignee: people.agentA,
    assigneeCount: Math.max(1, body.data.add.length),
    assigneesPreview:
      body.data.add.length > 0 ? [people.agentA] : base.assigneesPreview,
    updatedAt: "2026-05-02T11:00:00.000Z",
  };

  return sendValidatedData(res, TicketDetailSchema, ticket, "Assigned ticket");
};

export const updateTicketStatus: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);
  const body = TicketStatusSchema.safeParse(req.body?.status);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "ticket status payload", body.error.issues);
  }

  const base = cloneTicket(params.data.id);

  return sendValidatedData(
    res,
    TicketDetailSchema,
    { ...base, status: body.data, updatedAt: "2026-05-02T12:00:00.000Z" },
    "Ticket status update",
  );
};

export const updateTicketPriority: RequestHandler = (req, res) => {
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

  const base = cloneTicket(params.data.id);

  return sendValidatedData(
    res,
    TicketDetailSchema,
    { ...base, priority: body.data, updatedAt: "2026-05-02T12:30:00.000Z" },
    "Ticket priority update",
  );
};
