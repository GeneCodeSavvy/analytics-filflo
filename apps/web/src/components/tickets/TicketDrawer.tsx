import type { RefObject } from "react";
import {
  IconChevronRight,
  IconDots,
  IconMaximize,
  IconX,
} from "@tabler/icons-react";
import type { DrawerTab, TicketDetail, TicketStatus } from "../../types/tickets";
import { displayId, relativeTime } from "../../lib/ticketsComponent";
import { ActivityList } from "./ActivityList";
import { Assignees } from "./Assignees";
import { StatusPill } from "./StatusPill";

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
    <aside className="tickets-drawer">
      <div className="tickets-drawer-top">
        <button type="button" title="Close" onClick={closeDrawer}>
          <IconX className="h-4 w-4" />
        </button>
        <span className="font-mono text-muted-foreground">
          {displayId(detail.id)}
        </span>
        <IconChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{detail.subject}</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" title="Open full page">
            <IconMaximize className="h-4 w-4" />
          </button>
          <button type="button" title="More">
            <IconDots className="h-4 w-4" />
          </button>
        </div>
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
            className="tickets-title-input"
          />
        ) : (
          <h2
            onClick={() => setEditSubject(true)}
            className="tickets-drawer-title"
          >
            {detail.subject}
          </h2>
        )}
        <div className="tickets-meta">
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
          <button type="button" className="tickets-priority-chip">
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
        <div className="tickets-drawer-tabs">
          {DRAWER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDrawerTab(tab)}
              className={
                drawerTab === tab ? "text-foreground" : "text-muted-foreground"
              }
            >
              {tab}
            </button>
          ))}
          <span
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
                className="tickets-description-input"
              />
            ) : (
              <div
                onClick={() => setEditDescription(true)}
                className="tickets-editable"
              >
                {detail.description || detail.descriptionPreview}
              </div>
            )}
            <div className="tickets-editable text-sm text-muted-foreground">
              Category: {detail.category ?? "Uncategorized"}
            </div>
          </div>
        )}
        {drawerTab === "Activity" && <ActivityList activity={detail.activity} />}
        {drawerTab === "Messages" && (
          <div className="pt-4 text-sm text-muted-foreground">
            No messages attached to this ticket.
          </div>
        )}
      </div>
    </aside>
  );
}
