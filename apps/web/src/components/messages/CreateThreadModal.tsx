import { LoaderCircle, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthState } from "../../stores/useAuthStore";
import { useTicketListQuery } from "../../hooks/useTicketQueries";
import { useCreateThreadMutation } from "../../hooks/useMessageMutations";
import { PageLoader } from "../PageLoader";
import type { ThreadListRow } from "../../types/messages";
import {
  messageIconButton,
  messageInput,
  messagePrimaryButton,
  messageSecondaryButton,
} from "./styles";

type CreateThreadModalProps = {
  onClose: () => void;
  onCreated: (thread: ThreadListRow) => void;
};

export function CreateThreadModal({
  onClose,
  onCreated,
}: CreateThreadModalProps) {
  const actorRole = useAuthState((state) => state.user?.role);
  if (!actorRole) throw new Error("Authentication not completed");
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const user = useAuthState((s) => s.user);
  const createThread = useCreateThreadMutation();

  const ticketParams = useMemo(() => {
    const base = {
      sort: "updatedAt:desc",
      page: 1,
      pageSize: 50,
      q: search.trim() || undefined,
    };
    if (!user) return base;
    if (user.role === "SUPER_ADMIN") return base;
    if (user.role === "ADMIN") return { ...base, assigneeIds: [user.id] };
    if (user.role === "MODERATOR") return { ...base, orgIds: [user.orgId] };
    return { ...base, requesterIds: [user.id] };
  }, [user, search]);

  const ticketsQuery = useTicketListQuery(ticketParams);
  const tickets = ticketsQuery.data?.rows ?? [];

  const handleSubmit = () => {
    if (!selectedTicketId) return;
    createThread.mutate(selectedTicketId, {
      onSuccess: (thread) => {
        onCreated(thread);
        onClose();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-thread-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
      }}
    >
      <div className="flex w-[min(540px,calc(100vw_-_32px))] flex-col rounded-[--radius-md] border border-[--border-default] bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-[--border-default] px-4 py-3">
          <h2
            id="create-thread-title"
            className="m-0 text-[16px] font-semibold text-[--ink-1]"
          >
            New Thread
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={messageIconButton}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b border-[--border-default] px-4 py-3">
          <label className="flex h-9 items-center gap-2 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-3 shadow-[--elev-1] focus-within:border-[--border-focus]">
            <Search className="size-4 shrink-0 text-[--ink-3]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets…"
              autoFocus
              className={`${messageInput} min-w-0 flex-1`}
            />
          </label>
        </div>

        <div className="max-h-[320px] min-h-[120px] overflow-y-auto">
          {ticketsQuery.isLoading ? (
            <PageLoader inline />
          ) : tickets.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[--ink-3]">
              No eligible tickets found.
            </p>
          ) : (
            <div className="divide-y divide-[--border-default]">
              {tickets.map((ticket) => (
                <label
                  key={ticket.id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-[--surface-sunken] has-[:checked]:bg-[--surface-sunken]"
                >
                  <input
                    type="radio"
                    name="ticket"
                    value={ticket.id}
                    checked={selectedTicketId === ticket.id}
                    onChange={() => setSelectedTicketId(ticket.id)}
                    className="mt-1 size-3.5 shrink-0 accent-[--action-bg]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-[--ink-1]">
                        {ticket.subject}
                      </span>
                    </div>
                    <div className="mt-0.5 flex gap-2 text-[11px] text-[--ink-3]">
                      <span>
                        {actorRole === "SUPER_ADMIN" ||
                          (actorRole === "ADMIN" && ticket.org.name)}
                      </span>
                      <span>·</span>
                      <span>{ticket.status}</span>
                      <span>·</span>
                      <span>{ticket.priority}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {createThread.isError && (
          <p className="px-4 py-2 text-[12px] text-[--status-danger-fg]">
            {createThread.error.message}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-[--border-default] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className={messageSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedTicketId || createThread.isPending}
            className={messagePrimaryButton}
          >
            {createThread.isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : null}
            Create Thread
          </button>
        </div>
      </div>
    </div>
  );
}
