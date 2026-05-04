import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { dashboardStatusColor } from "../../lib/dashboardComponent";
import type { StatusDonutSlice } from "../../types/dashboard";

const chartPanelClass =
  "min-h-[280px] rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] p-5 shadow-[--elev-1] animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out";

const donutCellClass =
  "[transform-box:fill-box] origin-center transition-[transform,filter] duration-150 ease-out";

export function StatusDonut({
  slices,
  total,
}: {
  slices: StatusDonutSlice[];
  total: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : slices[activeIndex];

  return (
    <section className={`${chartPanelClass} [animation-delay:80ms]`}>
      <h2 className="mb-2 text-[16px] font-semibold text-[--ink-1]">
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
              stroke="var(--surface-card)"
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
                      ? `${donutCellClass} scale-[1.04] drop-shadow-[0_6px_10px_var(--surface-overlay)]`
                      : donutCellClass
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-[var(--font-sans)] text-[32px] font-semibold leading-none text-[--ink-1]">
            {active ? active.count : total}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[--ink-3]">
            {active ? active.status.replace("_", " ") : "All tickets"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {slices.map((slice) => (
          <div
            key={slice.status}
            className="flex items-center gap-1.5 text-xs text-[--ink-2]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: dashboardStatusColor[slice.status] }}
            />
            <span>{slice.status.replace("_", " ")}</span>
            <span className="text-[--ink-1]">{slice.count}</span>
            <span className="text-[--ink-3]">{slice.percent}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
