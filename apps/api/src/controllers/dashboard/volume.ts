import { RequestHandler } from "express";
import { VolumeBar } from "@shared/schema/dashboard";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";

const volume = {
  dimensionType: "org",
  rows: [
    {
      dimension: "Acme Fintech",
      dimensionId: "org_acme",
      total: 356,
      segments: [
        { status: "OPEN", count: 72 },
        { status: "IN PROGRESS", count: 96 },
        { status: "REVIEW", count: 18 },
        { status: "RESOLVED", count: 130 },
        { status: "CLOSED", count: 40 },
      ],
    },
    {
      dimension: "Northstar Retail",
      dimensionId: "org_northstar",
      total: 284,
      segments: [
        { status: "OPEN", count: 48 },
        { status: "IN PROGRESS", count: 70 },
        { status: "ON HOLD", count: 30 },
        { status: "RESOLVED", count: 104 },
        { status: "CLOSED", count: 32 },
      ],
    },
    {
      dimension: "Bluewave Logistics",
      dimensionId: "org_bluewave",
      total: 218,
      segments: [
        { status: "OPEN", count: 36 },
        { status: "IN PROGRESS", count: 54 },
        { status: "REVIEW", count: 24 },
        { status: "RESOLVED", count: 82 },
        { status: "CLOSED", count: 22 },
      ],
    },
    {
      dimension: "Vertex Health",
      dimensionId: "org_vertex",
      total: 176,
      segments: [
        { status: "OPEN", count: 28 },
        { status: "IN PROGRESS", count: 42 },
        { status: "ON HOLD", count: 16 },
        { status: "RESOLVED", count: 68 },
        { status: "CLOSED", count: 22 },
      ],
    },
  ],
} satisfies VolumeBar;

export const getVolume: RequestHandler = async (req, res) => {
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  return sendValidatedData(res, VolumeBar, volume);
};
