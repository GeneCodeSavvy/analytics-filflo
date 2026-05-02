import { RequestHandler } from "express";
import { Zone3DataSchema, type Zone3Data } from "@shared/schema/dashboard";
import {
  parseDashboardFilters,
  sendInvalidFilters,
  sendValidatedData,
} from "./utils";

const zone3 = {
  agingTickets: [
    {
      id: "TCK-1042",
      subject: "Webhook retries failing for Stripe events",
      priority: "HIGH",
      createdAt: "2026-04-28T09:15:00.000Z",
      ageMs: 360000000,
      isStaleHigh: true,
    },
    {
      id: "TCK-1031",
      subject: "Invoice export missing custom tax column",
      priority: "MEDIUM",
      createdAt: "2026-04-29T13:40:00.000Z",
      ageMs: 258000000,
      isStaleHigh: false,
    },
    {
      id: "TCK-1027",
      subject: "SSO callback intermittently times out",
      priority: "HIGH",
      createdAt: "2026-04-30T06:05:00.000Z",
      ageMs: 199800000,
      isStaleHigh: true,
    },
  ],
  recentActivity: [
    {
      actor: { id: "usr_001", name: "Aarav Mehta" },
      action: "moved ticket to review",
      ticket: {
        id: "TCK-1018",
        subject: "CSV import validation mismatch",
      },
      at: "2026-05-02T07:45:00.000Z",
    },
    {
      actor: { id: "usr_002", name: "Nisha Rao" },
      action: "resolved ticket",
      ticket: {
        id: "TCK-1009",
        subject: "Delayed notification delivery",
      },
      at: "2026-05-02T06:58:00.000Z",
    },
    {
      actor: { id: "usr_003", name: "Kabir Sen" },
      action: "assigned high priority ticket",
      ticket: {
        id: "TCK-1042",
        subject: "Webhook retries failing for Stripe events",
      },
      at: "2026-05-02T06:20:00.000Z",
    },
  ],
  myQueue: [
    {
      id: "TCK-1042",
      subject: "Webhook retries failing for Stripe events",
      priority: "HIGH",
      status: "IN_PROGRESS",
      requester: { name: "Acme Fintech" },
      ageMs: 360000000,
    },
    {
      id: "TCK-1038",
      subject: "Admin role cannot update billing address",
      priority: "MEDIUM",
      status: "OPEN",
      requester: { name: "Northstar Retail" },
      ageMs: 142200000,
    },
    {
      id: "TCK-1034",
      subject: "Attachment preview unavailable on Safari",
      priority: "LOW",
      status: "REVIEW",
      requester: { name: "Vertex Health" },
      ageMs: 95400000,
    },
  ],
  topUsers: [
    {
      user: { id: "usr_001", name: "Aarav Mehta" },
      openCount: 42,
      highPriorityCount: 8,
    },
    {
      user: { id: "usr_002", name: "Nisha Rao" },
      openCount: 37,
      highPriorityCount: 5,
    },
    {
      user: { id: "usr_003", name: "Kabir Sen" },
      openCount: 31,
      highPriorityCount: 6,
    },
  ],
  orgHealth: [
    {
      orgId: "org_acme",
      orgName: "Acme Fintech",
      openCount: 72,
      staleCount: 11,
      resolvedInRange: 130,
    },
    {
      orgId: "org_northstar",
      orgName: "Northstar Retail",
      openCount: 48,
      staleCount: 7,
      resolvedInRange: 104,
    },
    {
      orgId: "org_bluewave",
      orgName: "Bluewave Logistics",
      openCount: 36,
      staleCount: 5,
      resolvedInRange: 82,
    },
  ],
} satisfies Zone3Data;

export const getZone3: RequestHandler = async (req, res) => {
  const filters = parseDashboardFilters(req.query);

  if (!filters.success) {
    return sendInvalidFilters(res, filters.error.issues);
  }

  return sendValidatedData(res, Zone3DataSchema, zone3);
};
