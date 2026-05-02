import { TicketDetailSchema } from "@shared/schema/tickets";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { getTicketById, IdParamsSchema } from "./utils";

export const getTicket: RequestHandler = (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  const ticket = getTicketById(params.data.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: "Ticket not found",
    });
  }

  return sendValidatedData(
    res,
    TicketDetailSchema,
    ticket,
    "Ticket detail dummy data",
  );
};
