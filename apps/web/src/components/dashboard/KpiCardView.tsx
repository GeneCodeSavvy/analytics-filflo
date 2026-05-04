import {
  dashboardResolutionBreakdown,
  dashboardDanger,
  formatDashboardNumber,
  parseKpiValue,
} from "../../lib/dashboardComponent";
import type { KpiCardViewProps } from "../../types/dashboard";
import { Sparkline } from "./Sparkline";
import { useCountUp } from "./useCountUp";

const kpiCardClass =
  "flex flex-col justify-between rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] p-5 shadow-[--elev-1]";

export function KpiCardView({
  card,
  accent,
  positive,
  icon: Icon,
}: KpiCardViewProps) {
  const parsed = parseKpiValue(card.value);
  const count = useCountUp(parsed.numeric);
  const isGood = card.delta?.direction === positive;
  const deltaColor = isGood ? "var(--status-success-fg)" : dashboardDanger;

  return (
    <section className={kpiCardClass}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[--ink-3]">
            {card.label}
          </p>
          <Icon size={14} className="text-[--ink-3]" />
        </div>
        <div className="mt-3 font-[--font-sans] text-5xl font-semibold leading-none text-[--ink-1]">
          {typeof card.value === "number"
            ? formatDashboardNumber(count)
            : `${count}${parsed.suffix}`}
        </div>
        {card.label.toLowerCase().includes("resolution") ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dashboardResolutionBreakdown.map(({ label, value, color }) => (
              <span
                key={label}
                className="rounded-[--radius-pill] border-l-2 bg-[--surface-sunken] px-2 py-0.5 text-[10px] font-medium text-[--ink-2]"
                style={{ borderLeftColor: color }}
              >
                <span className="text-[--ink-1]">{label}</span> {value}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-xs" style={{ color: deltaColor }}>
            {card.delta?.direction === "up" ? "↑" : "↓"}{" "}
            {card.delta?.percent ?? 0}%
          </span>
          <span className="text-[10px] text-[--ink-3]">vs last 30d</span>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <Sparkline card={card} accent={accent} />
      </div>
    </section>
  );
}
