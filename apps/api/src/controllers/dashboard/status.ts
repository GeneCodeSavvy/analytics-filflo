import { RequestHandler } from "express";
import { StatusDonut } from "@shared/schema/dashboard";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";

const status = {
  total: 1284,
  slices: [
    { status: "OPEN", count: 246, percent: 19.2 },
    { status: "IN PROGRESS", count: 312, percent: 24.3 },
    { status: "REVIEW", count: 74, percent: 5.8 },
    { status: "ON HOLD", count: 96, percent: 7.5 },
    { status: "RESOLVED", count: 420, percent: 32.7 },
    { status: "CLOSED", count: 136, percent: 10.5 },
  ],
} satisfies StatusDonut;

export const getStatus: RequestHandler = async (req, res) => {
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  return sendValidatedData(res, StatusDonut, status);
};
