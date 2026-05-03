import { TicketDetailSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendNotFound, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { getTicketDetail } from "./data";
import { IdParamsSchema } from "./utils";

export const getTicket: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const ticket = await getTicketDetail(db, params.data.id);

  if (!ticket) {
    return sendNotFound(res, "Ticket");
  }

  return sendValidatedData(res, TicketDetailSchema, ticket);
};
