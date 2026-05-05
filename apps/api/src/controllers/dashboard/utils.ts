import { DashboardFilters } from "@shared/schema/dashboard";
import type { Request, Response } from "express";
import {
  sendInvalidRequest,
  sendValidatedData as sendControllerData,
  getQuerySource,
  toStringArray,
  type ValidationIssue,
} from "../../lib/controllers";
import { sendForbidden } from "../../lib/permissions";
import { scopeDashboardFilters } from "./permissions";

export const parseDashboardFilters = (query: unknown) => {
  const source = getQuerySource(query);

  return DashboardFilters.safeParse({
    range: source.range ?? "30d",
    rangeFrom: source.rangeFrom,
    rangeTo: source.rangeTo,
    orgIds: toStringArray(source.orgIds),
    priority: toStringArray(source.priority),
    category: toStringArray(source.category),
  });
};

export const sendInvalidFilters = (
  res: Response,
  issues: ValidationIssue[],
) => {
  return sendInvalidRequest(res, "dashboard filters", issues);
};

export const parseScopedDashboardFilters = (req: Request, res: Response) => {
  const parsed = parseDashboardFilters(req.query);

  if (!parsed.success) {
    sendInvalidFilters(res, parsed.error.issues);
    return null;
  }

  const scoped = scopeDashboardFilters(req.dbUser, parsed.data);

  if (!scoped.allowed) {
    sendForbidden(res);
    return null;
  }

  return scoped.filters;
};

export const sendValidatedData = <Output>(
  res: Response,
  schema: Parameters<typeof sendControllerData<Output>>[1],
  data: unknown,
) => sendControllerData(res, schema, data);
