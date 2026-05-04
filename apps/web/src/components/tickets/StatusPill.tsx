import { statusClass } from "../../lib/ticketsComponent";

type StatusPillProps = {
  status: string;
  pulse?: boolean;
};

export function StatusPill({ status, pulse = false }: StatusPillProps) {
  return (
    <span
      className={`tickets-status ${statusClass(status)} ${pulse ? "tickets-status-pulse" : ""}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
