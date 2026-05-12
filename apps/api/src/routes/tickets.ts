import { Router } from "express";
import createLogger from "@shared/logger";
import { getTicket } from "../controllers/tickets/detail";
import {
  assignTicket,
  bulkTickets,
  createTicket,
  deleteTicket,
  updateTicket,
  updateTicketPriority,
  updateTicketStatus,
} from "../controllers/tickets/mutations";
import { getTickets } from "../controllers/tickets/list";
import { searchTickets } from "../controllers/tickets/search";
import {
  createView,
  deleteView,
  getViews,
  updateView,
} from "../controllers/tickets/views";

const ticketsRouter: Router = Router();
const logger = createLogger("ticketsRoute");

ticketsRouter.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      logger.error({
        event: "ticket_request_failed",
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      });
    }
  });
  next();
});

ticketsRouter.get("/search", searchTickets);
ticketsRouter.get("/views", getViews);
ticketsRouter.post("/views", createView);
ticketsRouter.patch("/views/:id", updateView);
ticketsRouter.delete("/views/:id", deleteView);
ticketsRouter.post("/bulk", bulkTickets);
ticketsRouter.post("/bulk-update", bulkTickets);
ticketsRouter.get("/", getTickets);
ticketsRouter.post("/", createTicket);
ticketsRouter.get("/:id", getTicket);
ticketsRouter.patch("/:id", updateTicket);
ticketsRouter.delete("/:id", deleteTicket);
ticketsRouter.post("/:id/assign", assignTicket);
ticketsRouter.patch("/:id/status", updateTicketStatus);
ticketsRouter.patch("/:id/priority", updateTicketPriority);
ticketsRouter.use((req, res) => {
  logger.error({
    event: "ticket_route_not_found",
    method: req.method,
    path: req.originalUrl,
  });
  res.status(404).json({ success: false, error: "Ticket route not found" });
});

export default ticketsRouter;
