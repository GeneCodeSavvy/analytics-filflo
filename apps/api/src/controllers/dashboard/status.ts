import { RequestHandler } from "express";
import { StatusDonut } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import { parseScopedDashboardFilters, sendValidatedData } from "./utils";
import { getDashboardStatus } from "./data";

export const getStatus: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseScopedDashboardFilters(req, res);

  if (!filters) {
    return;
  }

  const status = await getDashboardStatus(db, filters);

  return sendValidatedData(res, StatusDonut, status);
};
