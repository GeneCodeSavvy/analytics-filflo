export const ticketButton =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm px-3 text-[13px] font-medium";

export const ticketPrimaryButton = `${ticketButton} justify-self-end border border-primary bg-primary text-white disabled:opacity-60`;

export const ticketSecondaryButton = `${ticketButton} border border-border text-foreground`;

export const ticketChip =
  "inline-flex h-[26px] items-center gap-1 whitespace-nowrap rounded-sm border border-border px-2 text-[12px] font-medium text-muted-foreground";

export const ticketFormInput =
  "w-full rounded-sm border border-border bg-transparent px-2.5 py-2 text-[14px] leading-[1.4] text-foreground outline-none focus:border-primary";

export const ticketEditable =
  "min-h-24 w-full rounded-sm border border-transparent bg-transparent p-2 text-[14px] leading-normal text-foreground outline-none hover:border-border focus:border-border";

export const ticketPageFrame =
  "app-page-frame relative flex h-full min-h-0 flex-col overflow-hidden bg-background font-sans text-foreground max-[760px]:-m-2";

export const ticketPageContent =
  "app-page-frame-content relative flex h-full min-h-0 flex-col overflow-hidden";

export const ticketTopBar =
  "grid h-12 shrink-0 grid-cols-[minmax(120px,1fr)_minmax(240px,480px)_minmax(140px,1fr)] items-center gap-4 border-b border-border px-4 max-[760px]:grid-cols-[1fr_auto]";

export const ticketSearchBox =
  "flex h-8 items-center gap-2 rounded-sm border border-border bg-background px-2 max-[760px]:order-3 max-[760px]:col-span-full";

export const ticketViewTabsRow =
  "flex h-11 shrink-0 items-center overflow-x-auto border-b border-border px-2.5";

export const ticketViewTabsList =
  "relative flex h-full min-w-max items-center gap-0.5";

export const ticketViewTab =
  "relative z-[1] h-full min-w-[118px] whitespace-nowrap px-2.5 text-[13px] font-medium";

export const ticketViewTabIndicator =
  "absolute bottom-0 left-0 h-1 w-[118px] bg-primary transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

export const ticketFiltersRow =
  "flex min-h-10 shrink-0 items-center justify-between gap-3 overflow-x-auto border-b border-border bg-muted/20 px-2.5 py-1.5";

export const ticketFilterControls =
  "flex min-w-max items-center gap-1.5";

export const ticketDensityToggle =
  "inline-flex h-7 items-center rounded-sm border border-border bg-background p-px";

export const ticketBulkBar =
  "fixed bottom-6 left-1/2 z-[70] flex h-12 w-[min(720px,calc(100vw_-_32px))] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-5 items-center gap-3 rounded-lg border border-border bg-background/80 px-3.5 shadow-xl backdrop-blur-md backdrop-saturate-150 duration-200 motion-reduce:animate-none";

export const ticketTableShell = "w-full min-w-0 overflow-auto";

export const ticketTable =
  "relative w-full min-w-[1060px] table-fixed border-collapse [&_tbody_td]:overflow-hidden [&_tbody_td]:px-2 [&_tbody_td]:align-middle [&_tbody_td]:text-[13px] [&_thead_th]:h-8 [&_thead_th]:select-none [&_thead_th]:px-2 [&_thead_th]:text-left [&_thead_th]:text-[11px] [&_thead_th]:font-medium [&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-muted-foreground";

export const ticketTableHead =
  "sticky top-0 z-10 h-8 bg-background shadow-[inset_0_-1px_var(--border)]";

export const ticketTableRowBase =
  "absolute left-0 table w-full table-fixed border-b border-border transition-[height,background] duration-200 ease-[ease] motion-reduce:transition-none";

export const ticketTableDataRow = `${ticketTableRowBase} group/row cursor-pointer hover:bg-muted/40`;

export const ticketTableSelectedRow = "bg-muted/40";

export const ticketTableGroupRow = `${ticketTableRowBase} bg-muted/30 font-mono text-[12px] leading-7 text-muted-foreground`;

export const ticketNewTicketsBanner =
  "absolute left-0 top-0 z-20 h-8 w-full bg-primary/10 text-[13px] font-medium text-primary";

export const ticketColumn = {
  strip: "w-8",
  select: "w-9",
  id: "w-[112px]",
  subject: "w-[32%]",
  status: "w-[116px]",
  category: "w-[132px]",
  org: "w-[132px]",
  people: "w-[118px]",
  updated: "w-[104px]",
  created: "w-[104px]",
  action: "w-8",
} as const;

export function ticketPriorityStrip(priority: string) {
  if (priority === "HIGH") return "bg-destructive";
  if (priority === "MEDIUM") return "bg-primary";
  return "bg-border";
}

export function ticketStatusPill(status: string) {
  if (status === "OPEN")
    return "border-primary/20 bg-primary/10 text-primary";
  if (status === "IN_PROGRESS")
    return "border-secondary/20 bg-secondary/10 text-secondary";
  if (status === "RESOLVED")
    return "border-muted bg-muted text-muted-foreground line-through";
  return "border-border bg-muted text-muted-foreground";
}
