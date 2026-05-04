import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  dashboardAction,
  dashboardInfo,
  dashboardInkMuted,
  getTrendChartData,
} from "../../lib/dashboardComponent";
import type { TrendChartProps } from "../../types/dashboard";

const chartPanelClass =
  "min-h-[280px] rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] p-5 shadow-[--elev-1] animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out";

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[--radius-sm] bg-[--ink-1] px-3 py-2 text-xs text-[--surface-card] shadow-[--elev-3]">
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
            <span className="capitalize text-[--ink-4]">{entry.dataKey}</span>
            <span>{entry.value}</span>
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
        <h2 className="text-[16px] font-semibold text-[--ink-1]">
          Volume trend
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[--ink-2]">
            <span className="h-px w-5 border-t border-dashed border-[--action-bg]" />{" "}
            Created
          </span>
          <span className="flex items-center gap-1.5 text-[--ink-2]">
            <span className="h-px w-5 bg-[--status-info-fg]" /> Resolved
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
                <stop
                  offset="0%"
                  stopColor={dashboardInfo}
                  stopOpacity={0.16}
                />
                <stop offset="100%" stopColor={dashboardInfo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border-subtle)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: dashboardInkMuted,
                fontSize: 10,
                fontFamily: "Geist Mono, ui-monospace, monospace",
              }}
              dy={8}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-default)" }}
              content={<ChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="backlogRange"
              stroke="none"
              fill="var(--status-danger-bg)"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke={dashboardInfo}
              strokeWidth={2}
              fill="url(#resolvedFill)"
              dot={false}
              activeDot={{
                r: 4,
                fill: dashboardInfo,
                stroke: "var(--surface-card)",
                strokeWidth: 2,
              }}
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke={dashboardAction}
              strokeOpacity={0.85}
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              dot={false}
              activeDot={{
                r: 4,
                fill: dashboardAction,
                stroke: "var(--surface-card)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
