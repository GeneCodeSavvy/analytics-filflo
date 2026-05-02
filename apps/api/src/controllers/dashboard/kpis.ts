import { RequestHandler } from "express";
import { DashboardKpis } from "@shared/schema/dashboard";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";

const kpis = {
  totalTickets: {
    label: "Total tickets",
    value: 1284,
    delta: { percent: 12.4, direction: "up" },
    sparkline: [
      { date: "2026-04-26", value: 148 },
      { date: "2026-04-27", value: 171 },
      { date: "2026-04-28", value: 162 },
      { date: "2026-04-29", value: 184 },
      { date: "2026-04-30", value: 198 },
      { date: "2026-05-01", value: 206 },
      { date: "2026-05-02", value: 215 },
    ],
    subline: "Across all active queues",
  },
  pending: {
    label: "Pending",
    value: 342,
    delta: { percent: 5.8, direction: "down" },
    sparkline: [
      { date: "2026-04-26", value: 396 },
      { date: "2026-04-27", value: 381 },
      { date: "2026-04-28", value: 374 },
      { date: "2026-04-29", value: 366 },
      { date: "2026-04-30", value: 351 },
      { date: "2026-05-01", value: 347 },
      { date: "2026-05-02", value: 342 },
    ],
  },
  awaitingReview: {
    label: "Awaiting review",
    value: 74,
    delta: { percent: 3.1, direction: "up" },
    sparkline: [
      { date: "2026-04-26", value: 58 },
      { date: "2026-04-27", value: 62 },
      { date: "2026-04-28", value: 67 },
      { date: "2026-04-29", value: 64 },
      { date: "2026-04-30", value: 70 },
      { date: "2026-05-01", value: 72 },
      { date: "2026-05-02", value: 74 },
    ],
  },
  resolved: {
    label: "Resolved",
    value: 816,
    delta: { percent: 9.6, direction: "up" },
    sparkline: [
      { date: "2026-04-26", value: 96 },
      { date: "2026-04-27", value: 101 },
      { date: "2026-04-28", value: 112 },
      { date: "2026-04-29", value: 118 },
      { date: "2026-04-30", value: 124 },
      { date: "2026-05-01", value: 132 },
      { date: "2026-05-02", value: 133 },
    ],
  },
  avgResolutionTime: {
    label: "Avg. resolution time",
    value: "4h 18m",
    delta: { percent: 7.2, direction: "down" },
    sparkline: [
      { date: "2026-04-26", value: 6.1 },
      { date: "2026-04-27", value: 5.8 },
      { date: "2026-04-28", value: 5.4 },
      { date: "2026-04-29", value: 5.1 },
      { date: "2026-04-30", value: 4.9 },
      { date: "2026-05-01", value: 4.5 },
      { date: "2026-05-02", value: 4.3 },
    ],
    subline: "Target is under 6h",
  },
  personalVsTeamAvgResolution: {
    personal: "3h 52m",
    team: "4h 18m",
  },
} satisfies DashboardKpis;

export const getKpis: RequestHandler = async (req, res) => {
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  return sendValidatedData(res, DashboardKpis, kpis);
};
