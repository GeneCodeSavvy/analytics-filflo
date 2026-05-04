import {
  dashboardResolutionBreakdown,
  formatDashboardNumber,
  parseKpiValue,
  warning,
} from "../../lib/dashboardComponent";
import type { KpiCardViewProps } from "../../types/dashboard";
import { Sparkline } from "./Sparkline";
import { useCountUp } from "./useCountUp";

export function KpiCardView({ card, accent, positive, icon: Icon }: KpiCardViewProps) {
  const parsed = parseKpiValue(card.value);
  const count = useCountUp(parsed.numeric);
  const isGood = card.delta?.direction === positive;
  const deltaColor = isGood ? "#059669" : warning;

  return (
    <section className="rounded-xl border border-[#E8E6E0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
          {card.label}
        </p>
        <Icon size={14} className="text-[#9CA3AF]" />
      </div>
      <div className="mt-3 font-mono text-5xl font-medium leading-none text-[#08060d]">
        {typeof card.value === "number"
          ? formatDashboardNumber(count)
          : `${count}${parsed.suffix}`}
      </div>
      {card.label.toLowerCase().includes("resolution") ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dashboardResolutionBreakdown.map(({ label, value, color }) => (
            <span
              key={label}
              className="rounded-full border-l-2 bg-[#FAFAF8] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]"
              style={{ borderLeftColor: color }}
            >
              <span className="font-mono text-[#08060d]">{label}</span> {value}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-xs" style={{ color: deltaColor }}>
          {card.delta?.direction === "up" ? "↑" : "↓"}{" "}
          {card.delta?.percent ?? 0}%
        </span>
        <span className="text-[10px] text-[#9CA3AF]">vs last 30d</span>
      </div>
      <div className="mt-4">
        <Sparkline card={card} accent={accent} />
      </div>
    </section>
  );
}
