import { ListResponseSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { ticketDetails } from "./data";
import { filterTickets, parseTicketListParams, sortTickets, toTicketRow } from "./utils";

export const getTickets: RequestHandler = (req, res) => {
  const params = parseTicketListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket list params", params.error.issues);
  }

  const filteredTickets = filterTickets(ticketDetails, params.data);
  const sortedTickets = sortTickets(filteredTickets, params.data.sort);
  const start = (params.data.page - 1) * params.data.pageSize;
  const rows = sortedTickets
    .slice(start, start + params.data.pageSize)
    .map(toTicketRow);

  return sendValidatedData(
    res,
    ListResponseSchema,
    {
      rows,
      total: filteredTickets.length,
      page: params.data.page,
      pageSize: params.data.pageSize,
      serverTime: "2026-05-02T00:00:00.000Z",
    },
    "Ticket list dummy data",
  );
};
