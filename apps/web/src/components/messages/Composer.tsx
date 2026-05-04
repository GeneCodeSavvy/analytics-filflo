import { LoaderCircle, Paperclip, Send } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef } from "react";
import type { MessageComposerProps } from "../../types/messages";

export function Composer({
  value,
  disabled,
  sending,
  onChange,
  onSend,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <footer className="border-t border-border bg-white px-5 py-4">
      <div className="rounded-sm border border-border bg-white shadow-sm focus-within:ring-1 focus-within:ring-zinc-900">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply with ticket context..."
          rows={2}
          className="max-h-36 min-h-20 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between border-t border-border px-2 py-2">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Press ⌘↵ to send
            </span>
            <button
              type="button"
              onClick={onSend}
              disabled={disabled || sending || value.trim().length === 0}
              className="inline-flex h-8 items-center gap-2 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {sending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Use @ to mention, # to reference tickets.
      </p>
    </footer>
  );
}
