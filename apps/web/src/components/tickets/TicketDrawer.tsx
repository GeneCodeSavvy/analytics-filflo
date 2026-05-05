import type { RefObject } from "react";
import { IconChevronRight, IconX } from "@tabler/icons-react";
import type {
  DrawerTab,
  TicketDetail,
  TicketStatus,
} from "../../types/tickets";
import { displayId, relativeTime } from "../../lib/ticketsComponent";
import { cn } from "../../lib/utils";
import { ActivityList } from "./ActivityList";
import { Assignees } from "./Assignees";
import { StatusPill } from "./StatusPill";
import { ticketEditable } from "./styles";

type TicketDrawerProps = {
  closeDrawer: () => void;
  descriptionRef: RefObject<HTMLTextAreaElement | null>;
  detail: TicketDetail;
  drawerTab: DrawerTab;
  editDescription: boolean;
  editSubject: boolean;
  saveDescription: (value: string) => void;
  saveSubject: (value: string) => void;
  setDrawerTab: (tab: DrawerTab) => void;
  setEditDescription: (editing: boolean) => void;
  setEditSubject: (editing: boolean) => void;
  statusMutation: {
    mutate: (payload: { id: string; status: TicketStatus }) => void;
  };
  subjectRef: RefObject<HTMLInputElement | null>;
};

const DRAWER_TABS: DrawerTab[] = ["Details", "Activity", "Messages"];

export function TicketDrawer({
  closeDrawer,
  descriptionRef,
  detail,
  drawerTab,
  editDescription,
  editSubject,
  saveDescription,
  saveSubject,
  setDrawerTab,
  setEditDescription,
  setEditSubject,
  statusMutation,
  subjectRef,
}: TicketDrawerProps) {
  return (
    <aside className="absolute bottom-0 right-0 top-[88px] z-30 flex w-[min(560px,calc(100%_-_382px))] min-w-[360px] animate-in slide-in-from-right duration-200 flex-col border-l border-border bg-background shadow-xl motion-reduce:animate-none max-[760px]:w-full max-[760px]:min-w-0">
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border px-3 text-[13px]">
        <button
          type="button"
          aria-label="Close Ticket Drawer"
          title="Close"
          onClick={closeDrawer}
        >
          <IconX className="h-4 w-4" />
        </button>
        <span className="font-mono text-muted-foreground">
          {displayId(detail.id)}
        </span>
        <IconChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{detail.subject}</span>
        <div className="ml-auto" />
      </div>
      <div className="flex-1 overflow-auto p-5">
        {editSubject ? (
          <input
            ref={subjectRef}
            defaultValue={detail.subject}
            onBlur={(event) => saveSubject(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveSubject(event.currentTarget.value);
              if (event.key === "Escape") setEditSubject(false);
            }}
            className="mb-3.5 w-full border-0 bg-transparent font-sans text-2xl font-medium leading-tight text-foreground outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditSubject(true)}
            className="mb-3.5 w-full text-left font-sans text-2xl font-medium leading-tight text-foreground"
          >
            {detail.subject}
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3.5">
          <button
            type="button"
            onClick={() =>
              statusMutation.mutate({
                id: detail.id,
                status: "REVIEW",
              })
            }
          >
            <StatusPill status={detail.status} />
          </button>
          <button
            type="button"
            className="inline-flex h-[22px] items-center rounded-sm bg-muted px-[7px] text-[11px] text-muted-foreground"
          >
            {detail.priority}
          </button>
          <Assignees row={detail} />
          <span className="font-mono text-[12px] text-muted-foreground">
            Created {relativeTime(detail.createdAt)}
          </span>
          <span className="font-mono text-[12px] text-muted-foreground">
            Updated {relativeTime(detail.updatedAt)}
          </span>
        </div>
        <div className="relative flex h-[38px] items-center border-b border-border">
          {DRAWER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDrawerTab(tab)}
              className={cn(
                "h-full w-[84px] text-[13px] font-medium",
                drawerTab === tab ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {tab}
            </button>
          ))}
          <span
            className="absolute bottom-0 left-0 h-[1.5px] w-[84px] bg-primary transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
            style={{
              transform: `translateX(${DRAWER_TABS.indexOf(drawerTab) * 100}%)`,
            }}
          />
        </div>
        {drawerTab === "Details" && (
          <div className="space-y-4 pt-4">
            {editDescription ? (
              <textarea
                ref={descriptionRef}
                defaultValue={detail.description}
                onBlur={(event) => saveDescription(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter")
                    saveDescription(event.currentTarget.value);
                  if (event.key === "Escape") setEditDescription(false);
                }}
                className={ticketEditable}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditDescription(true)}
                className={`${ticketEditable} block text-left`}
              >
                {detail.description || detail.descriptionPreview}
              </button>
            )}
            <div
              className={cn(ticketEditable, "text-sm text-muted-foreground")}
            >
              Category: {detail.category ?? "Uncategorized"}
            </div>
          </div>
        )}
        {drawerTab === "Activity" && (
          <ActivityList activity={detail.activity} />
        )}
        {drawerTab === "Messages" && (
          <div className="pt-4 text-sm text-muted-foreground">
            No messages attached to this ticket.
          </div>
        )}
      </div>
    </aside>
  );
}
