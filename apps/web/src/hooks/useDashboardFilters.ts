import { useMemo } from "react";
import { useSearchParams } from "react-router";
import type { DashboardFilters, Priority, Range } from "../types/dashboard";
import { VALID_RANGES, VALID_PRIORITIES } from "../config/dashboard";

function parseRange(val: string | null): Range {
  return VALID_RANGES.includes(val as Range) ? (val as Range) : "30d";
}

function parsePriority(val: string | null): Priority[] | undefined {
  if (!val) return undefined;
  const parts = val
    .split(",")
    .filter((p): p is Priority => VALID_PRIORITIES.includes(p as Priority));
  return parts.length > 0 ? parts : undefined;
}

function parseList(val: string | null): string[] | undefined {
  if (!val) return undefined;
  const parts = val.split(",").filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export function useDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: DashboardFilters = useMemo(() => ({
    range: parseRange(searchParams.get("range")),
    rangeFrom: searchParams.get("rangeFrom") ?? undefined,
    rangeTo: searchParams.get("rangeTo") ?? undefined,
    orgIds: parseList(searchParams.get("orgIds")),
    priority: parsePriority(searchParams.get("priority")),
    category: parseList(searchParams.get("category")),
  }), [searchParams]);

  const setFilters = (partial: Partial<DashboardFilters>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (partial.range !== undefined) next.set("range", partial.range);

      if ("rangeFrom" in partial) {
        partial.rangeFrom
          ? next.set("rangeFrom", partial.rangeFrom)
          : next.delete("rangeFrom");
      }
      if ("rangeTo" in partial) {
        partial.rangeTo
          ? next.set("rangeTo", partial.rangeTo)
          : next.delete("rangeTo");
      }
      if ("orgIds" in partial) {
        partial.orgIds?.length
          ? next.set("orgIds", partial.orgIds.join(","))
          : next.delete("orgIds");
      }
      if ("priority" in partial) {
        partial.priority?.length
          ? next.set("priority", partial.priority.join(","))
          : next.delete("priority");
      }
      if ("category" in partial) {
        partial.category?.length
          ? next.set("category", partial.category.join(","))
          : next.delete("category");
      }

      return next;
    });
  };

  return { filters, setFilters };
}
