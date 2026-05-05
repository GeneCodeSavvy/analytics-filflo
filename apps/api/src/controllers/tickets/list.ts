import { ListResponseSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { sendForbidden } from "../../lib/permissions";
import { getTicketList } from "./data";
import { scopeTicketParams } from "./permissions";
import { parseTicketListParams } from "./utils";

export const getTickets: RequestHandler = async (req, res) => {
  const params = parseTicketListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket list params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const scoped = scopeTicketParams(req.dbUser, params.data);

  if (!scoped.allowed) {
    return sendForbidden(res);
  }

  const { rows, total } = await getTicketList(db, scoped.params);

  return sendValidatedData(res, ListResponseSchema, {
    rows,
    total,
    page: params.data.page,
    pageSize: params.data.pageSize,
    serverTime: new Date().toISOString(),
  });
};
