import { RequestHandler } from "express";
import { Zone3DataSchema } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";
import { getDashboardZone3 } from "./data";

export const getZone3: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  const zone3 = await getDashboardZone3(db, filters.data);

  return sendValidatedData(res, Zone3DataSchema, zone3);
};
