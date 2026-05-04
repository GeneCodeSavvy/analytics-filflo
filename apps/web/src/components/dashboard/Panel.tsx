import type { PanelProps } from "../../types/dashboard";

export function Panel({ title, count, children }: PanelProps) {
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
