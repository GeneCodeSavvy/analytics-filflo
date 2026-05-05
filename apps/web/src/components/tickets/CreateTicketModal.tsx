import type { Dispatch, RefObject, SetStateAction } from "react";
import { IconX } from "@tabler/icons-react";
import type {
  TicketCategory,
  TicketDraft,
  TicketPriority,
} from "../../types/tickets";
import { CATEGORIES, PRIORITIES } from "../../lib/ticketsComponent";
import {
  ticketFormInput,
  ticketPrimaryButton,
  ticketSecondaryButton,
} from "./styles";

type CreateTicketModalProps = {
  closeModal: () => void;
  draft: TicketDraft;
  error: string;
  isPending: boolean;
  modalSubjectRef: RefObject<HTMLInputElement | null>;
  setDraft: Dispatch<SetStateAction<TicketDraft>>;
  submitDraft: () => void;
};

export function CreateTicketModal({
  closeModal,
  draft,
  error,
  isPending,
  modalSubjectRef,
  setDraft,
  submitDraft,
}: CreateTicketModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ticket-title"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter")
          submitDraft();
      }}
    >
      <form
        className="w-[min(520px,calc(100vw_-_32px))] rounded-sm border border-border bg-background shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          submitDraft();
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2
            id="create-ticket-title"
            className="m-0 text-[16px] font-medium text-foreground"
          >
            New Ticket
          </h2>
          <button
            type="button"
            aria-label="Close New Ticket"
            title="Close"
            onClick={closeModal}
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-muted-foreground">
              Subject
            </span>
            <input
              ref={modalSubjectRef}
              name="subject"
              autoComplete="off"
              value={draft.subject}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  subject: event.target.value,
                }))
              }
              placeholder="Login button fails after checkout…"
              className={`${ticketFormInput} text-[18px]`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-muted-foreground">
              Description
            </span>
            <textarea
              name="description"
              autoComplete="off"
              value={draft.description}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  description: event.target.value,
                }))
              }
              placeholder="What happened, who is affected, and what should happen next…"
              className={`${ticketFormInput} min-h-32 resize-none`}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-muted-foreground">
                Category
              </span>
              <select
                name="category"
                autoComplete="off"
                value={draft.category}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    category: event.target.value as TicketCategory | "",
                  }))
                }
                className={ticketFormInput}
              >
                <option value="">Uncategorized</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-muted-foreground">
                Priority
              </span>
              <select
                name="priority"
                autoComplete="off"
                value={draft.priority}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    priority: event.target.value as TicketPriority,
                  }))
                }
                className={ticketFormInput}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <div aria-live="polite" className="text-[12px] text-destructive">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={closeModal}
            className={ticketSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={ticketPrimaryButton}
          >
            {isPending ? "Creating…" : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
