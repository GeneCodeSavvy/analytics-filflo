import { useEffect, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { useDashboardFilters } from "../../hooks/useDashboardFilters";
import { useZone1Query } from "../../hooks/useZone1Query";
import { useZone2Query } from "../../hooks/useZone2Query";
import { useZone3Query } from "../../hooks/useZone3Query";
import { dashboardKpiMeta, dashboardRanges } from "../../lib/dashboardComponent";
import { AgingTickets } from "./AgingTickets";
import { KpiCardView } from "./KpiCardView";
import { MyQueue } from "./MyQueue";
import { RecentActivity } from "./RecentActivity";
import { StatusDonut } from "./StatusDonut";
import { TrendChart } from "./TrendChart";

export function Dashboard() {
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
      <main className="app-page-frame dashboard-page flex items-center justify-center">
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
      <main className="app-page-frame dashboard-page flex items-center justify-center">
        <div className="rounded-xl border border-[#E8E6E0] bg-white px-4 py-3 text-sm text-[#08060d]">
          Dashboard data is unavailable.
        </div>
      </main>
    );
  }

  return (
    <main className="app-page-frame dashboard-page">
      <div
        className={`app-page-frame-content ${isRefreshing ? "dashboard-refreshing" : ""}`}
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

export default Dashboard;
