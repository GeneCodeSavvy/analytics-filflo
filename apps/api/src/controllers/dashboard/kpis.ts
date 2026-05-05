import { RequestHandler } from "express";
import { DashboardKpis } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import { parseScopedDashboardFilters, sendValidatedData } from "./utils";
import { getDashboardKpis } from "./data";

export const getKpis: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseScopedDashboardFilters(req, res);

  if (!filters) {
    return;
  }

  const kpis = await getDashboardKpis(db, filters);

  return sendValidatedData(res, DashboardKpis, kpis);
};
