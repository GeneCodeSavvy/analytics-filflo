import { useEffect, useState } from "react";
import { PageLoader } from "../PageLoader";
import { useDashboardFilters } from "../../hooks/useDashboardFilters";
import { useTeamOrgsQuery } from "../../hooks/useTeamsQueries";
import { useZone1Query } from "../../hooks/useZone1Query";
import { useZone2Query } from "../../hooks/useZone2Query";
import { useZone3Query } from "../../hooks/useZone3Query";
import {
  dashboardKpiMeta,
  dashboardRanges,
} from "../../lib/dashboardComponent";
import { AgingTickets } from "./AgingTickets";
import { KpiCardView } from "./KpiCardView";
import { MyQueue } from "./MyQueue";
import { RecentActivity } from "./RecentActivity";
import { StatusDonut } from "./StatusDonut";
import { TrendChart } from "./TrendChart";

const dashboardPageClass =
  "app-page-frame bg-[--surface-page] font-mono text-[--ink-1]";

const controlButtonClass =
  "h-8 rounded-[--radius-sm] px-3 text-[12px] font-medium leading-none transition-colors";

export function Dashboard() {
  const { filters, setFilters } = useDashboardFilters();
  const orgsQuery = useTeamOrgsQuery();
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
    return <PageLoader />;
  }

  if (
    isError ||
    !zone1.data ||
    !zone2.status.data ||
    !zone2.trend.data ||
    !zone3.data
  ) {
    return (
      <main
        className={`${dashboardPageClass} flex items-center justify-center`}
      >
        <div className="rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] px-4 py-3 text-[13px] text-[--ink-1] shadow-[--elev-1]">
          Dashboard data is unavailable.
        </div>
      </main>
    );
  }

  return (
    <main className={dashboardPageClass}>
      <div className="app-page-frame-content">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[--border-default] bg-[--surface-page] py-3">
          <h1 className="text-[30px] font-bold leading-none text-[--ink-1]">
            Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] p-0.5 shadow-[--elev-1]">
              {dashboardRanges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setFilters({ range })}
                  className={`${controlButtonClass} ${
                    filters.range === range
                      ? "bg-(--action-tint-bg) text-(--action-tint-fg) font-semibold"
                      : "text-[--ink-3] hover:bg-[--surface-sunken] hover:text-[--ink-1]"
                  }`}
                >
                  {range === "all" ? "All" : range}
                </button>
              ))}
            </div>
            <select
              value={filters.orgIds?.[0] ?? ""}
              onChange={(e) =>
                setFilters({ orgIds: e.target.value ? [e.target.value] : undefined })
              }
              className="h-8 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-2 text-[12px] font-medium text-[--ink-1] shadow-[--elev-1] transition-colors hover:border-[--border-strong] focus:outline-none focus:ring-1 focus:ring-[--border-focus]"
            >
              <option value="">All orgs</option>
              {orgsQuery.data?.map((s) => (
                <option key={s.org.id} value={s.org.id}>
                  {s.org.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div
          className={`py-3 transition-opacity duration-200 ease-out ${
            isRefreshing ? "opacity-[0.45]" : ""
          }`}
        >
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

export default Dashboard;
