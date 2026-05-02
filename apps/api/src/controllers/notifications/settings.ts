import { NotificationApiSettingsSchema } from "@shared/schema";
import type { RequestHandler } from "express";
import { sendInvalidRequest, sendValidatedData } from "../../lib/controllers";
import { notificationSettings } from "./data";

const UpdateNotificationApiSettingsSchema =
  NotificationApiSettingsSchema.partial();

export const getNotificationSettings: RequestHandler = (_req, res) => {
  return sendValidatedData(
    res,
    NotificationApiSettingsSchema,
    notificationSettings,
    "Notification settings dummy data",
  );
};

export const updateNotificationSettings: RequestHandler = (req, res) => {
  const body = UpdateNotificationApiSettingsSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(
      res,
      "notification settings payload",
      body.error.issues,
    );
  }

  return sendValidatedData(
    res,
    NotificationApiSettingsSchema,
    {
      ...notificationSettings,
      ...body.data,
    },
    "Updated notification settings",
  );
};
