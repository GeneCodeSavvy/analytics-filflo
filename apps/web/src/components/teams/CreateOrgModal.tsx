import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
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
    // Reset form state only when the modal opens. Including the mutation object
    // here causes the controlled inputs to reset during typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createOrg.mutate(
      {
        displayName,
        logoUrl,
      },
      {
        onSuccess: onClose,
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[--z-modal] bg-[--surface-overlay] flex items-center justify-center p-4 backdrop-blur-[4px]">
      <form
        className="w-[min(480px,100%)] rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] shadow-[--elev-4]"
        onSubmit={submit}
      >
        <div className="flex items-center justify-between border-b border-[--border-subtle] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Building2 size={17} className="text-[--ink-1]" />
            <h2 className="m-0 text-[15px] leading-none font-semibold text-[--ink-1]">
              Create org
            </h2>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[--radius-sm] border border-transparent bg-transparent text-[--ink-3] hover:bg-[--surface-sunken]"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-4 text-[13px] font-mono">
          <label className="grid gap-1.5">
            <span className="text-[--ink-3]">Org name</span>
            <input
              autoFocus
              className="rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-[10px] py-[9px] text-[--ink-1] outline-none focus:border-[--border-focus]"
              maxLength={120}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Acme Support"
              value={displayName}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[--ink-3]">Logo URL</span>
            <input
              className="rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-[10px] py-[9px] text-[--ink-1] outline-none focus:border-[--border-focus]"
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://..."
              value={logoUrl}
            />
          </label>
          {createOrg.isError ? (
            <div className="rounded-[--radius-sm] border border-[--status-danger-border] bg-[--status-danger-bg] px-3 py-2 text-[--status-danger-fg]">
              Unable to create org.
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[--border-subtle] px-5 py-4">
          <button
            className="rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-3 py-[9px] text-[13px] font-medium text-[--ink-1] hover:bg-[--surface-sunken]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-[--radius-sm] border border-transparent bg-[--action-bg] px-3 py-[9px] text-[13px] font-medium text-[--action-fg] hover:bg-[--action-bg-hover] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!displayName.trim() || createOrg.isPending}
            type="submit"
          >
            <Building2 size={16} />
            {createOrg.isPending ? "Creating..." : "Create org"}
          </button>
        </div>
      </form>
    </div>
  );
}
