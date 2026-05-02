import { Router } from "express";
import {
  getNotificationCount,
  getNotifications,
  getNotificationThread,
} from "../controllers/notifications/list";
import {
  bulkNotifications,
  muteTicket,
  respondToInvitation,
  snoozeNotification,
  unmuteTicket,
  updateNotificationState,
} from "../controllers/notifications/mutations";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notifications/settings";

const notificationsRouter: Router = Router();

notificationsRouter.get("/count", getNotificationCount);
notificationsRouter.get("/settings", getNotificationSettings);
notificationsRouter.patch("/settings", updateNotificationSettings);
notificationsRouter.post("/bulk", bulkNotifications);
notificationsRouter.post("/invitations/:invitationId/respond", respondToInvitation);
notificationsRouter.post("/mute", muteTicket);
notificationsRouter.delete("/mute/:ticketId", unmuteTicket);
notificationsRouter.get("/", getNotifications);
notificationsRouter.patch("/:id", updateNotificationState);
notificationsRouter.patch("/:id/snooze", snoozeNotification);
notificationsRouter.get("/:id/thread", getNotificationThread);

export default notificationsRouter;
