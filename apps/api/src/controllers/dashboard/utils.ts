import type { Response } from "express";
import { DashboardFilters } from "@shared/schema/dashboard";

type ValidationIssue = {
  code: string;
  path: (string | number)[];
  message: string;
};

type SafeParseResult<Output> =
  | { success: true; data: Output }
  | { success: false; error: { issues: ValidationIssue[] } };

type SafeParseSchema<Output> = {
  safeParse: (data: unknown) => SafeParseResult<Output>;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === "string" ? [item] : []));
  }

  return typeof value === "string" ? [value] : undefined;
};

export const parseDashboardFilters = (query: unknown) => {
  const source =
    typeof query === "object" && query !== null
      ? (query as Record<string, unknown>)
      : {};

  return DashboardFilters.safeParse({
    range: source.range ?? "30d",
    rangeFrom: source.rangeFrom,
    rangeTo: source.rangeTo,
    orgIds: toStringArray(source.orgIds),
    priority: toStringArray(source.priority),
    category: toStringArray(source.category),
  });
};

export const sendValidatedData = <Output>(
  res: Response,
  schema: SafeParseSchema<Output>,
  data: unknown,
) => {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return res.status(500).json({
      success: false,
      error: "Dashboard dummy data failed response validation",
      issues: parsed.error.issues,
    });
  }

  return res.json(parsed.data);
};

export const sendInvalidFilters = (
  res: Response,
  issues: ValidationIssue[],
) => {
  return res.status(400).json({
    success: false,
    error: "Invalid dashboard filters",
    issues,
  });
};
