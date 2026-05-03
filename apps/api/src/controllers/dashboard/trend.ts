import { RequestHandler } from "express";
import { VolumeTrend } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";
import { getDashboardTrend } from "./data";

export const getTrend: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  const trend = await getDashboardTrend(db, filters.data);

  return sendValidatedData(res, VolumeTrend, trend);
};
