import { RequestHandler } from "express";
import { VolumeBar } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import { parseScopedDashboardFilters, sendValidatedData } from "./utils";
import { getDashboardVolume } from "./data";

export const getVolume: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseScopedDashboardFilters(req, res);

  if (!filters) {
    return;
  }

  const volume = await getDashboardVolume(db, filters);

  return sendValidatedData(res, VolumeBar, volume);
};
