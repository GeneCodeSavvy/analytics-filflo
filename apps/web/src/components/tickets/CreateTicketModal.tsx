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
  isPending: boolean;
  modalSubjectRef: RefObject<HTMLInputElement | null>;
  setDraft: Dispatch<SetStateAction<TicketDraft>>;
  submitDraft: () => void;
};

export function CreateTicketModal({
  closeModal,
  draft,
  isPending,
  modalSubjectRef,
  setDraft,
  submitDraft,
}: CreateTicketModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
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
          <h2 className="m-0 text-[16px] font-medium text-foreground">
            New ticket
          </h2>
          <button type="button" title="Close" onClick={closeModal}>
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <input
            ref={modalSubjectRef}
            value={draft.subject}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                subject: event.target.value,
              }))
            }
            placeholder="Subject"
            className={`${ticketFormInput} text-[18px]`}
          />
          <textarea
            value={draft.description}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                description: event.target.value,
              }))
            }
            placeholder="Description"
            className={`${ticketFormInput} min-h-32 resize-none`}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  category: event.target.value as TicketCategory | "",
                }))
              }
              className={ticketFormInput}
            >
              <option value="">Category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
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
          </div>
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
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
