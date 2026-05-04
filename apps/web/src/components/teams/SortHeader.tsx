import { ChevronDown } from "lucide-react";
import type { SortDirection, SortKey } from "../../types/teams";

export function SortHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 border-0 bg-transparent text-inherit p-0"
      onClick={() => onSort(sortKey)}
      type="button"
    >
      {label}
      <ChevronDown
        size={13}
        className={`transition-transform duration-150${active === sortKey && direction === "desc" ? " rotate-180" : ""}`}
      />
    </button>
  );
}
