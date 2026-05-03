import { DashboardFilters } from "@shared/schema/dashboard";
import {
  sendInvalidRequest,
  sendValidatedData as sendControllerData,
  getQuerySource,
  toStringArray,
  type ValidationIssue,
} from "../../lib/controllers";

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
  res: import("express").Response,
  issues: ValidationIssue[],
) => {
  return sendInvalidRequest(res, "dashboard filters", issues);
};

export const sendValidatedData = <Output>(
  res: import("express").Response,
  schema: Parameters<typeof sendControllerData<Output>>[1],
  data: unknown,
) => sendControllerData(res, schema, data);
