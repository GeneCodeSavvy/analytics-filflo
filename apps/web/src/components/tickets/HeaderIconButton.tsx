import type { ReactNode } from "react";

type HeaderIconButtonProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
};

export function HeaderIconButton({
  label,
  children,
  onClick,
  active = false,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`tickets-icon-button ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
