import { TicketRowsSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { ticketDetails } from "./data";
import { filterTickets, parseTicketSearchParams, toTicketRow } from "./utils";

export const searchTickets: RequestHandler = (req, res) => {
  const params = parseTicketSearchParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket search params", params.error.issues);
  }

  const rows = filterTickets(ticketDetails, params.data)
    .slice(0, params.data.limit ?? 20)
    .map(toTicketRow);

  return sendValidatedData(
    res,
    TicketRowsSchema,
    rows,
    "Ticket search dummy data",
  );
};
