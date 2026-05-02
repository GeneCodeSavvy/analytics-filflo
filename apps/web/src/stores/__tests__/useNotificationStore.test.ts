import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNotificationStore } from "../useNotificationStore";

beforeEach(() => {
  useNotificationStore.setState({
    expandedGroupIds: {},
    selectedIds: {},
  });
});

describe("toggleGroup", () => {
  it("adds group id when not present", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleGroup("abc"));
    expect(result.current.isExpanded("abc")).toBe(true);
  });

  it("removes group id when already present", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleGroup("abc"));
    act(() => result.current.toggleGroup("abc"));
    expect(result.current.isExpanded("abc")).toBe(false);
  });
});

describe("isExpanded", () => {
  it("returns false for unknown id", () => {
    const { result } = renderHook(() => useNotificationStore());
    expect(result.current.isExpanded("unknown")).toBe(false);
  });
});

describe("selectRows", () => {
  it("replaces selection wholesale", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.selectRows(["a", "b", "c"]));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("z")).toBe(false);
  });
});

describe("toggleRowSelected", () => {
  it("adds id when not selected", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleRowSelected("x"));
    expect(result.current.isSelected("x")).toBe(true);
  });

  it("removes id when already selected", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleRowSelected("x"));
    act(() => result.current.toggleRowSelected("x"));
    expect(result.current.isSelected("x")).toBe(false);
  });
});

describe("clearSelection", () => {
  it("empties selectedIds", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.selectRows(["a", "b"]));
    act(() => result.current.clearSelection());
    expect(result.current.isSelected("a")).toBe(false);
  });
});

describe("selectedCount", () => {
  it("returns count of selected rows", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.selectRows(["a", "b", "c"]));
    expect(result.current.selectedCount()).toBe(3);
  });
});
