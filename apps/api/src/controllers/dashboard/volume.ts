import { RequestHandler } from "express";
import { VolumeBar } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";
import { getDashboardVolume } from "./data";

export const getVolume: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  const volume = await getDashboardVolume(db, filters.data);

  return sendValidatedData(res, VolumeBar, volume);
};
