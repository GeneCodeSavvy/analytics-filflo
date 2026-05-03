import { ListResponseSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { getTicketList } from "./data";
import { parseTicketListParams } from "./utils";

export const getTickets: RequestHandler = async (req, res) => {
  const params = parseTicketListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket list params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const { rows, total } = await getTicketList(db, params.data);

  return sendValidatedData(res, ListResponseSchema, {
    rows,
    total,
    page: params.data.page,
    pageSize: params.data.pageSize,
    serverTime: new Date().toISOString(),
  });
};
