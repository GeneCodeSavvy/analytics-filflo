import { useState } from "react";
import { absoluteTime, relativeTime } from "../../lib/ticketsComponent";

type TimeCellProps = {
  value: string;
  muted?: boolean;
};

export function TimeCell({ value, muted = false }: TimeCellProps) {
  const [absolute, setAbsolute] = useState(false);
  return (
    <span
      onMouseEnter={() => setAbsolute(true)}
      onMouseLeave={() => setAbsolute(false)}
      className={`font-mono text-[12px] ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {absolute ? absoluteTime(value) : relativeTime(value)}
    </span>
  );
}
