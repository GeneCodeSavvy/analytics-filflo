import type { PanelProps } from "../../types/dashboard";

const panelClass =
  "overflow-hidden rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] shadow-[--elev-1] animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out";

export function Panel({ title, count, children }: PanelProps) {
  return (
    <section className={panelClass}>
      <div className="flex items-center justify-between border-b border-[--border-subtle] px-5 pb-3 pt-4">
        <h2 className="text-[16px] font-semibold text-[--ink-1]">{title}</h2>
        <span className="rounded-[--radius-pill] bg-[--surface-sunken] px-2 py-0.5 text-[11px] text-[--ink-2]">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}
