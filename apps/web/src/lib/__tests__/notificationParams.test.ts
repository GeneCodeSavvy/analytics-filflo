import { describe, it, expect } from "vitest";
import {
  parseFilters,
  mergeFilters,
  buildListKey,
  serializeTypes,
} from "../notificationParams";

describe("parseFilters", () => {
  it("returns default tab inbox when no params", () => {
    const result = parseFilters(new URLSearchParams());
    expect(result.tab).toBe("inbox");
  });

  it("parses tab from URL", () => {
    const result = parseFilters(new URLSearchParams("tab=done"));
    expect(result.tab).toBe("done");
  });

  it("parses comma-separated types", () => {
    const result = parseFilters(
      new URLSearchParams("type=ticket_assigned,review_requested")
    );
    expect(result.type).toEqual(["ticket_assigned", "review_requested"]);
  });

  it("parses ticketId and orgId", () => {
    const result = parseFilters(
      new URLSearchParams("ticketId=abc&orgId=xyz")
    );
    expect(result.ticketId).toBe("abc");
    expect(result.orgId).toBe("xyz");
  });
});

describe("mergeFilters", () => {
  it("sets tab in params", () => {
    const result = mergeFilters(new URLSearchParams(), { tab: "read" });
    expect(result.get("tab")).toBe("read");
  });

  it("removes type param when empty array", () => {
    const base = new URLSearchParams("type=ticket_assigned");
    const result = mergeFilters(base, { type: [] });
    expect(result.has("type")).toBe(false);
  });

  it("does not mutate original params", () => {
    const base = new URLSearchParams("tab=inbox");
    mergeFilters(base, { tab: "done" });
    expect(base.get("tab")).toBe("inbox");
  });
});

describe("buildListKey", () => {
  it("produces stable key regardless of object key order", () => {
    const a = buildListKey({ tab: "inbox", page: 1, pageSize: 25 });
    const b = buildListKey({ page: 1, tab: "inbox", pageSize: 25 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("omits undefined values", () => {
    const key = buildListKey({ tab: "inbox", ticketId: undefined, page: 1, pageSize: 25 });
    expect(key).not.toHaveProperty("ticketId");
  });
});

describe("serializeTypes", () => {
  it("joins types with comma", () => {
    expect(serializeTypes(["ticket_assigned", "review_requested"])).toBe(
      "ticket_assigned,review_requested"
    );
  });
});
