import { Router } from "express";
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

ticketsRouter.get("/search", searchTickets);
ticketsRouter.get("/views", getViews);
ticketsRouter.post("/views", createView);
ticketsRouter.patch("/views/:id", updateView);
ticketsRouter.delete("/views/:id", deleteView);
ticketsRouter.post("/bulk", bulkTickets);
ticketsRouter.get("/", getTickets);
ticketsRouter.post("/", createTicket);
ticketsRouter.get("/:id", getTicket);
ticketsRouter.patch("/:id", updateTicket);
ticketsRouter.delete("/:id", deleteTicket);
ticketsRouter.post("/:id/assign", assignTicket);
ticketsRouter.patch("/:id/status", updateTicketStatus);
ticketsRouter.patch("/:id/priority", updateTicketPriority);

export default ticketsRouter;
