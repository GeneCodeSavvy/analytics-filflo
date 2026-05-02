import { RequestHandler } from "express";
import { VolumeTrend } from "@shared/schema/dashboard";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";

const trend = {
  points: [
    { date: "2026-04-26", created: 148, resolved: 96 },
    { date: "2026-04-27", created: 171, resolved: 101 },
    { date: "2026-04-28", created: 162, resolved: 112 },
    { date: "2026-04-29", created: 184, resolved: 118 },
    { date: "2026-04-30", created: 198, resolved: 124 },
    { date: "2026-05-01", created: 206, resolved: 132 },
    { date: "2026-05-02", created: 215, resolved: 133 },
  ],
} satisfies VolumeTrend;

export const getTrend: RequestHandler = async (req, res) => {
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  return sendValidatedData(res, VolumeTrend, trend);
};
