import { RequestHandler } from "express";
import { VolumeTrend } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import { parseScopedDashboardFilters, sendValidatedData } from "./utils";
import { getDashboardTrend } from "./data";

export const getTrend: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseScopedDashboardFilters(req, res);

  if (!filters) {
    return;
  }

  const trend = await getDashboardTrend(db, filters);

  return sendValidatedData(res, VolumeTrend, trend);
};
