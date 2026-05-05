import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCreateOrgMutation } from "../../hooks/useTeamsMutations";

export function CreateOrgModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createOrg = useCreateOrgMutation();
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (!open) return;

    setDisplayName("");
    setLogoUrl("");
    createOrg.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createOrg.mutate({ displayName, logoUrl }, { onSuccess: onClose });
  };

  return (
    <div
      className="fixed inset-0 z-[--z-modal] bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <form
        className="w-[min(480px,calc(100vw-32px))] border border-[--border-default] rounded-[--radius-md] bg-white bg-[--surface-card] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_12px_rgba(0,0,0,0.12)] font-mono text-[13px]"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="m-0 text-[18px] font-semibold text-[--ink-1]">Create org</h2>
          <button
            aria-label="Close"
            className="inline-flex items-center justify-center w-[30px] h-[30px] border border-transparent rounded-[--radius-sm] bg-transparent text-[--ink-3] hover:bg-[--surface-sunken]"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <label className="grid gap-1.5 my-3">
          <span className="text-[--ink-3] text-[12px]">Org name</span>
          <input
            autoFocus
            className="w-full border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] text-[--ink-1] px-[10px] py-[9px] outline-none focus:border-[--border-focus]"
            maxLength={120}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Acme Support"
            value={displayName}
          />
        </label>
        <label className="grid gap-1.5 my-3">
          <span className="text-[--ink-3] text-[12px]">Logo URL</span>
          <input
            className="w-full border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] text-[--ink-1] px-[10px] py-[9px] outline-none focus:border-[--border-focus]"
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
            value={logoUrl}
          />
        </label>
        {createOrg.isError ? (
          <div className="rounded-[--radius-sm] border border-[--status-danger-border] bg-[--status-danger-bg] px-3 py-2 text-[--status-danger-fg] my-3">
            Unable to create org.
          </div>
        ) : null}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent px-3 py-[9px] font-medium bg-[--action-bg] text-[--action-fg] transition-colors hover:bg-[--action-bg-hover] disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={!displayName.trim() || createOrg.isPending}
            type="submit"
          >
            {createOrg.isPending ? "Creating..." : "Create org"}
          </button>
          <button
            className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-[--border-default] px-3 py-[9px] font-medium bg-[--surface-card] text-[--ink-1] transition-colors hover:bg-[--surface-sunken]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
