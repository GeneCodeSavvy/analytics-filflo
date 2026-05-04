import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type HeaderIconButtonProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
};

export function HeaderIconButton({
  label,
  children,
  onClick,
  active = false,
  className,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-[calc(var(--radius-sm)-2px)]",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
