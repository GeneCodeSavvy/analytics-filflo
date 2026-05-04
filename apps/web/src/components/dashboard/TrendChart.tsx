import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { getTrendChartData, muted, teal } from "../../lib/dashboardComponent";
import type { TrendChartProps } from "../../types/dashboard";

const chartPanelClass =
  "min-h-[280px] rounded-xl border border-[#E8E6E0] bg-white p-5 opacity-0 shadow-[0_1px_4px_0_hsl(0_0%_0%_/_0.05),0_1px_2px_-1px_hsl(0_0%_0%_/_0.05)] translate-y-20 animate-[dashboard-panel-enter_300ms_ease-out_forwards]";

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#08060d] px-3 py-2 text-xs text-white shadow-lg">
      {payload
        .filter(
          (entry: any) =>
            entry.dataKey === "created" || entry.dataKey === "resolved",
        )
        .map((entry: any) => (
          <div
            key={entry.dataKey}
            className="flex min-w-32 items-center justify-between gap-5"
          >
            <span className="capitalize text-white/70">{entry.dataKey}</span>
            <span className="font-mono">{entry.value}</span>
          </div>
        ))}
    </div>
  );
}

export function TrendChart({ points }: TrendChartProps) {
  const data = getTrendChartData(points);

  return (
    <section className={chartPanelClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-[#08060d]">Volume trend</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[#6B7280]">
            <span className="h-px w-5 border-t border-dashed border-[#D97706]" />{" "}
            Created
          </span>
          <span className="flex items-center gap-1.5 text-[#6B7280]">
            <span className="h-px w-5 bg-[oklch(0.5360_0.0398_196)]" /> Resolved
          </span>
        </div>
      </div>
      <div className="h-[224px] cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 6, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={teal} stopOpacity={0.1} />
                <stop offset="100%" stopColor={teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#F0EDE8"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: muted,
                fontSize: 10,
                fontFamily: "Geist Mono, ui-monospace, monospace",
              }}
              dy={8}
            />
            <Tooltip
              cursor={{ stroke: "#E8E6E0" }}
              content={<ChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="backlogRange"
              stroke="none"
              fill="rgba(239,68,68,0.04)"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke={teal}
              strokeWidth={2}
              fill="url(#resolvedFill)"
              dot={false}
              activeDot={{ r: 4, fill: teal, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="#D97706"
              strokeOpacity={0.7}
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#D97706",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
