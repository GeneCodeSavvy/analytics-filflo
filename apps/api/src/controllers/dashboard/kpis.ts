import { RequestHandler } from "express";
import { DashboardKpis } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";
import { getDashboardKpis } from "./data";

export const getKpis: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  const kpis = await getDashboardKpis(db, filters.data);

  return sendValidatedData(res, DashboardKpis, kpis);
};
