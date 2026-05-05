import { RequestHandler } from "express";
import { Zone3DataSchema } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import { parseScopedDashboardFilters, sendValidatedData } from "./utils";
import { getDashboardZone3 } from "./data";

export const getZone3: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseScopedDashboardFilters(req, res);

  if (!filters) {
    return;
  }

  const zone3 = await getDashboardZone3(db, filters);

  return sendValidatedData(res, Zone3DataSchema, zone3);
};
