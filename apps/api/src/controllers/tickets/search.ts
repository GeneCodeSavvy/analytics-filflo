import { TicketRowsSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { sendForbidden } from "../../lib/permissions";
import { searchTicketList } from "./data";
import { scopeTicketParams } from "./permissions";
import { parseTicketSearchParams } from "./utils";

export const searchTickets: RequestHandler = async (req, res) => {
  const params = parseTicketSearchParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket search params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const scoped = scopeTicketParams(req.dbUser, params.data);

  if (!scoped.allowed) {
    return sendForbidden(res);
  }

  const rows = await searchTicketList(db, scoped.params);

  return sendValidatedData(res, TicketRowsSchema, rows);
};
