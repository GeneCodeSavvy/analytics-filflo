import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { dashboardStatusColor } from "../../lib/dashboardComponent";
import type { StatusDonutSlice } from "../../types/dashboard";

const chartPanelClass =
  "min-h-[280px] rounded-xl border border-[#E8E6E0] bg-white p-5 opacity-0 shadow-[0_1px_4px_0_hsl(0_0%_0%_/_0.05),0_1px_2px_-1px_hsl(0_0%_0%_/_0.05)] translate-y-20 animate-[dashboard-panel-enter_300ms_ease-out_forwards]";

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
                      ? `${donutCellClass} scale-[1.04] drop-shadow-[0_6px_10px_rgb(8_6_13_/_0.16)]`
                      : donutCellClass
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
