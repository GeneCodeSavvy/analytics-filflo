import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  IconAlertCircle,
  IconChevronDown,
  IconInbox,
  IconTicket,
} from "@tabler/icons-react";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useZone1Query } from "../hooks/useZone1Query";
import { useZone2Query } from "../hooks/useZone2Query";
import { useZone3Query } from "../hooks/useZone3Query";
import {
  ageLabel,
  avatarColor,
  dashboardKpiMeta,
  dashboardPriorityColor,
  dashboardRanges,
  dashboardStatusColor,
  formatDashboardNumber,
  initials,
  muted,
  parseKpiValue,
  teal,
  timeAgo,
  warning,
} from "../lib/dashboardComponent";
import type {
  ActivityEntry,
  AgingTicket,
  KpiCard,
  MyQueueTicket,
  StatusDonutSlice,
  TrendPoint,
} from "../types/dashboard";

function useCountUp(target: number, duration = 400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
}

function Sparkline({ card, accent }: { card: KpiCard; accent: string }) {
  const points = card.sparkline;
  const path = useMemo(() => {
    if (!points.length) return { line: "", fill: "" };
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(max - min, 1);
    const coords = points.map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 28 - ((point.value - min) / spread) * 24;
      return [x, y] as const;
    });
    const line = coords
      .map(
        ([x, y], index) =>
          `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
      )
      .join(" ");
    const fill = `${line} L 100 32 L 0 32 Z`;
    return { line, fill };
  }, [points]);

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
      <path d={path.fill} fill={accent} opacity="0.08" />
      <path
        d={path.line}
        fill="none"
        stroke={accent}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        opacity="0.6"
        className="dashboard-sparkline-path"
      />
    </svg>
  );
}

function KpiCardView({
  card,
  accent,
  positive,
  icon: Icon,
}: {
  card: KpiCard;
  accent: string;
  positive: "up" | "down";
  icon: typeof IconTicket;
}) {
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
          {[
            ["HIGH", "4h", dashboardPriorityColor.HIGH],
            ["MED", "1.2d", dashboardPriorityColor.MEDIUM],
            ["LOW", "3.5d", dashboardPriorityColor.LOW],
          ].map(([label, value, color]) => (
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

function TrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    backlogRange:
      point.created > point.resolved ? [point.resolved, point.created] : null,
  }));

  return (
    <section className="dashboard-chart-panel dashboard-panel-enter">
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

function StatusDonut({
  slices,
  total,
}: {
  slices: StatusDonutSlice[];
  total: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : slices[activeIndex];

  return (
    <section className="dashboard-chart-panel dashboard-panel-enter [animation-delay:80ms]">
      <h2 className="mb-2 text-[13px] font-medium text-[#08060d]">
        Status donut
      </h2>
      <div className="relative h-[180px] cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="status"
              innerRadius="60%"
              outerRadius="84%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              isAnimationActive
            >
              {slices.map((slice, index) => (
                <Cell
                  key={slice.status}
                  fill={dashboardStatusColor[slice.status]}
                  className={
                    index === activeIndex
                      ? "dashboard-donut-active"
                      : "dashboard-donut-cell"
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[32px] font-medium leading-none text-[#08060d]">
            {active ? active.count : total}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
            {active ? active.status.replace("_", " ") : "All tickets"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {slices.map((slice) => (
          <div
            key={slice.status}
            className="flex items-center gap-1.5 text-xs text-[#6B7280]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: dashboardStatusColor[slice.status] }}
            />
            <span>{slice.status.replace("_", " ")}</span>
            <span className="font-mono text-[#08060d]">{slice.count}</span>
            <span className="font-mono text-[#9CA3AF]">{slice.percent}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E8E6E0] bg-white">
      <div className="flex items-center justify-between border-b border-[#F0EDE8] px-5 pb-3 pt-4">
        <h2 className="text-[13px] font-medium text-[#08060d]">{title}</h2>
        <span className="rounded-full bg-[#F4F3EC] px-2 py-0.5 text-[11px] text-[#6B7280]">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function AgingTickets({ tickets }: { tickets: AgingTicket[] }) {
  return (
    <Panel title="Aging tickets" count={tickets.length}>
      <div className="divide-y divide-[#F0EDE8]">
        {tickets.slice(0, 6).map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            className="group grid w-full cursor-crosshair grid-cols-[18px_minmax(72px,92px)_1fr_54px_16px] items-center gap-2 px-4 py-3 text-left transition hover:-translate-x-0.5 hover:bg-[#FAFAF8]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: dashboardPriorityColor[ticket.priority],
              }}
            />
            <span className="truncate font-mono text-xs text-[#08060d] transition group-hover:text-[#D97706]">
              {ticket.id}
            </span>
            <span className="truncate text-sm text-[#08060d]">
              {ticket.subject}
            </span>
            <span
              className={`flex items-center justify-end gap-1 font-mono text-xs ${
                ticket.isStaleHigh ? "text-[#DC2626]" : "text-[#9CA3AF]"
              }`}
            >
              {ticket.isStaleHigh ? <IconAlertCircle size={12} /> : null}
              {ageLabel(ticket.ageMs)}
            </span>
            <span className="text-[#D97706] opacity-0 transition group-hover:opacity-100">
              →
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="cursor-crosshair px-5 py-3 text-xs font-medium text-[#D97706]"
      >
        Show all →
      </button>
    </Panel>
  );
}

function RecentActivity({ activity }: { activity: ActivityEntry[] }) {
  return (
    <Panel title="Recent activity" count={activity.length}>
      <div className="dashboard-feed max-h-[330px] overflow-y-auto px-5 py-4">
        {activity.map((entry, index) => (
          <div
            key={`${entry.ticket.id}-${entry.at}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {index < activity.length - 1 ? (
              <span className="absolute left-3 top-7 h-[calc(100%-28px)] w-px bg-[#F0EDE8]" />
            ) : null}
            <div
              className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium text-white"
              style={{ backgroundColor: avatarColor(entry.actor.name) }}
            >
              {initials(entry.actor.name)}
            </div>
            <p className="min-w-0 pt-0.5 text-[13px] leading-5 text-[#08060d]">
              <span>
                {entry.actor.name} {entry.action}{" "}
              </span>
              <span className="font-mono text-[#D97706]">
                {entry.ticket.id}
              </span>
              <span className="text-[#9CA3AF]"> · {timeAgo(entry.at)}</span>
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MyQueue({ tickets }: { tickets: MyQueueTicket[] }) {
  return (
    <Panel title="My queue" count={tickets.length}>
      <div className="py-3">
        {tickets.length ? (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              className="mx-3 mb-2 block w-[calc(100%-1.5rem)] cursor-crosshair rounded-lg border border-[#F0EDE8] bg-[#FAFAF8] p-3 text-left transition hover:-translate-y-px hover:border-[#E8E6E0]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    color: dashboardPriorityColor[ticket.priority],
                    borderColor: dashboardPriorityColor[ticket.priority],
                  }}
                >
                  {ticket.priority}
                </span>
                <span className="font-mono text-[11px] text-[#6B7280]">
                  {ticket.id}
                </span>
              </div>
              <div className="truncate text-[13px] font-medium text-[#08060d]">
                {ticket.subject}
              </div>
              <div className="mt-1 truncate text-[10px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                {ticket.requester?.name ?? ticket.status.replace("_", " ")}
              </div>
            </button>
          ))
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
            <IconInbox size={32} className="text-[#D1CEC7]" />
            <p className="text-[13px] text-[#9CA3AF]">You're all caught up</p>
          </div>
        )}
      </div>
    </Panel>
  );
}

export default function Dashboard() {
  const { filters, setFilters } = useDashboardFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const zone1 = useZone1Query(filters);
  const zone2 = useZone2Query(filters);
  const zone3 = useZone3Query(filters);

  useEffect(() => {
    setIsRefreshing(true);
    const timeout = window.setTimeout(() => setIsRefreshing(false), 200);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  const isLoading = zone1.isLoading || zone2.isLoading || zone3.isLoading;
  const isError = zone1.isError || zone2.isError || zone3.isError;

  if (isLoading) {
    return (
      <main className="dashboard-page flex items-center justify-center">
        <div className="font-mono text-sm text-[#9CA3AF]">
          Preparing dashboard
        </div>
      </main>
    );
  }

  if (
    isError ||
    !zone1.data ||
    !zone2.status.data ||
    !zone2.trend.data ||
    !zone3.data
  ) {
    return (
      <main className="dashboard-page flex items-center justify-center">
        <div className="rounded-xl border border-[#E8E6E0] bg-white px-4 py-3 text-sm text-[#08060d]">
          Dashboard data is unavailable.
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div
        className={`mx-auto max-w-[1320px] ${isRefreshing ? "dashboard-refreshing" : ""}`}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E8E6E0] bg-[#FAFAF8]/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E6E0] bg-white font-mono text-xs font-medium text-[#08060d]">
              FF
            </div>
            <h1 className="text-sm font-medium text-[#08060d]">Tickets</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#E8E6E0] bg-white p-0.5">
              {dashboardRanges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setFilters({ range })}
                  className={`h-7 cursor-crosshair rounded-md px-3 text-xs font-medium transition ${
                    filters.range === range
                      ? "bg-[oklch(0.6716_0.1368_48.5130)] text-white"
                      : "text-[#6B7280] hover:text-[#08060d]"
                  }`}
                >
                  {range === "all" ? "All" : range}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex h-8 cursor-crosshair items-center gap-2 rounded-lg border border-[#E8E6E0] bg-white px-3 text-xs font-medium text-[#08060d]"
            >
              Org <IconChevronDown size={14} className="text-[#9CA3AF]" />
            </button>
          </div>
        </header>

        <div className="dashboard-data-zones py-3">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {dashboardKpiMeta.map((meta) => (
              <KpiCardView
                key={meta.key}
                card={zone1.data[meta.key]}
                icon={meta.icon}
                accent={meta.accent}
                positive={meta.positive}
              />
            ))}
          </section>

          <section className="mt-3 grid min-h-[280px] grid-cols-1 gap-3 lg:grid-cols-[3fr_2fr]">
            <TrendChart points={zone2.trend.data.points} />
            <StatusDonut
              slices={zone2.status.data.slices}
              total={zone2.status.data.total}
            />
          </section>

          <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
            <AgingTickets tickets={zone3.data.agingTickets ?? []} />
            <RecentActivity activity={zone3.data.recentActivity ?? []} />
            <MyQueue tickets={zone3.data.myQueue ?? []} />
          </section>
        </div>
      </div>
    </main>
  );
}
