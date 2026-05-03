import { RequestHandler } from "express";
import { StatusDonut } from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";
import { getDashboardStatus } from "./data";

export const getStatus: RequestHandler = async (req, res) => {
  const db = req.app.locals.db as DbClient;
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  const status = await getDashboardStatus(db, filters.data);

  return sendValidatedData(res, StatusDonut, status);
};
