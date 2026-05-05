import { TicketDetailSchema } from "@shared/schema/tickets";
import createLogger from "@shared/logger";
import type { RequestHandler } from "express";
import {
  sendInvalidRequest,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import { getTicketDetail, getTicketOrg } from "./data";
import { ensureTicketOrgReadable } from "./permissions";
import { IdParamsSchema } from "./utils";

const logger = createLogger("ticketDetailController");

export const getTicket: RequestHandler = async (req, res) => {
  const params = IdParamsSchema.safeParse(req.params);

  if (!params.success) {
    logger.error("Invalid ticket detail params");
    return sendInvalidRequest(res, "ticket id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  logger.info(`Loading ticket ${params.data.id} for user ${req.dbUser.id}`);
  const target = await getTicketOrg(db, params.data.id);

  if (!target) {
    logger.error(`Ticket ${params.data.id} was not found`);
    return sendNotFound(res, "Ticket");
  }

  if (!ensureTicketOrgReadable(res, req.dbUser, target)) {
    logger.error(
      `User ${req.dbUser.id} cannot read ticket ${params.data.id} in org ${target.orgId}`,
    );
    return;
  }

  const ticket = await getTicketDetail(db, params.data.id);

  if (!ticket) {
    logger.error(`Ticket ${params.data.id} disappeared before detail load`);
    return sendNotFound(res, "Ticket");
  }

  logger.info(`Returning ticket ${params.data.id}`);
  return sendValidatedData(res, TicketDetailSchema, ticket, "Ticket detail");
};
