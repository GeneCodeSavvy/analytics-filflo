import { statusClass } from "../../lib/ticketsComponent";
import { cn } from "../../lib/utils";

type StatusPillProps = {
  status: string;
  pulse?: boolean;
};

export function StatusPill({ status, pulse = false }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] min-w-[78px] items-center justify-center whitespace-nowrap rounded-sm px-1 text-[11px] font-medium",
        statusClass(status),
        pulse &&
          "motion-safe:animate-[pulse_280ms_ease] motion-reduce:animate-none",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
