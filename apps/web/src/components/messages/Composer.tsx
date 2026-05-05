import { LoaderCircle, Paperclip, Send } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef } from "react";
import type { MessageComposerProps } from "../../types/messages";
import {
  messageIconButton,
  messageInput,
  messageKbd,
  messagePrimaryButton,
} from "./styles";

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
    <footer className="border-t border-[--border-default] bg-[--surface-card] px-4 py-3">
      <div className="rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] shadow-[--elev-1] focus-within:border-[--border-focus]">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply with ticket context..."
          rows={2}
          className={`${messageInput} max-h-36 min-h-20 resize-none px-3 py-3 leading-6`}
        />
        <div className="flex items-center justify-between border-t border-[--border-default] px-2 py-2">
          <button
            type="button"
            disabled
            title="File upload coming soon"
            className={`${messageIconButton} opacity-40`}
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 text-[12px] text-[--ink-3] sm:inline-flex">
              <span>Send</span>
              <kbd className={messageKbd}>⌘↵</kbd>
            </span>
            <button
              type="button"
              onClick={onSend}
              disabled={disabled || sending || value.trim().length === 0}
              className={messagePrimaryButton}
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
    </footer>
  );
}
