import { TicketRowsSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { searchTicketList } from "./data";
import { parseTicketSearchParams } from "./utils";

export const searchTickets: RequestHandler = async (req, res) => {
  const params = parseTicketSearchParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket search params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const rows = await searchTicketList(db, params.data);

  return sendValidatedData(res, TicketRowsSchema, rows);
};
