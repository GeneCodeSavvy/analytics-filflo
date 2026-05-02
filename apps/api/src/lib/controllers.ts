import type { Response } from "express";

export type ValidationIssue = {
  code: string;
  path: (string | number)[];
  message: string;
};

type SafeParseResult<Output> =
  | { success: true; data: Output }
  | { success: false; error: { issues: ValidationIssue[] } };

export type SafeParseSchema<Output> = {
  safeParse: (data: unknown) => SafeParseResult<Output>;
};

export type QuerySource = Record<string, unknown>;

export const getQuerySource = (query: unknown): QuerySource =>
  typeof query === "object" && query !== null
    ? (query as QuerySource)
    : {};

export const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === "string" ? [item] : []));
  }

  return typeof value === "string" ? [value] : undefined;
};

export const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

export const sendError = (
  res: Response,
  status: number,
  error: string,
  details?: Record<string, unknown>,
) => {
  return res.status(status).json({
    success: false,
    error,
    ...details,
  });
};

export const sendValidatedData = <Output>(
  res: Response,
  schema: SafeParseSchema<Output>,
  data: unknown,
  label = "Dummy data",
) => {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return sendError(res, 500, `${label} failed response validation`, {
      issues: parsed.error.issues,
    });
  }

  return res.json(parsed.data);
};

export const sendInvalidRequest = (
  res: Response,
  label: string,
  issues: ValidationIssue[],
) => {
  return sendError(res, 400, `Invalid ${label}`, {
    issues,
  });
};

export const sendNotFound = (res: Response, label: string) => {
  return sendError(res, 404, `${label} not found`);
};

export const parseRequestData = <Output>(
  res: Response,
  schema: SafeParseSchema<Output>,
  data: unknown,
  label: string,
) => {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    sendInvalidRequest(res, label, parsed.error.issues);
    return null;
  }

  return parsed.data;
};

export const sendOk = (res: Response, schema: SafeParseSchema<{ ok: true }>, label: string) => {
  return sendValidatedData(res, schema, { ok: true }, label);
};
