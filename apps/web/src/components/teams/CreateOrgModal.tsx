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
    <div className="fixed inset-0 z-30 bg-[rgba(26,25,23,0.28)] flex items-center justify-center p-4">
      <form
        className="w-[min(420px,100%)] rounded-lg border border-[#E8E6E1] bg-white shadow-[0_18px_50px_rgba(26,25,23,0.18)]"
        onSubmit={submit}
      >
        <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Building2 size={17} />
            <h2 className="m-0 text-[15px] leading-none font-semibold">
              Create org
            </h2>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E8E6E1] bg-white text-[#78756E]"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-4">
          <label className="grid gap-1.5">
            <span className="text-[#78756E]">Org name</span>
            <input
              autoFocus
              className="rounded-md border border-[#E8E6E1] bg-white px-3 py-2.5 text-[#1A1917] outline-[#C4642A]"
              maxLength={120}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Acme Support"
              value={displayName}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[#78756E]">Logo URL</span>
            <input
              className="rounded-md border border-[#E8E6E1] bg-white px-3 py-2.5 text-[#1A1917] outline-[#C4642A]"
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://..."
              value={logoUrl}
            />
          </label>
          {createOrg.isError ? (
            <div className="rounded-md border border-[#F1B8AF] bg-[#FFF7F5] px-3 py-2 text-[#B83A2A]">
              Unable to create org.
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#E8E6E1] px-5 py-4">
          <button
            className="rounded-md border border-[#E8E6E1] bg-white px-3 py-2 text-[#78756E]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-[#C4642A] px-3 py-2 text-white hover:bg-[#A8521E] disabled:cursor-not-allowed disabled:opacity-60"
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
