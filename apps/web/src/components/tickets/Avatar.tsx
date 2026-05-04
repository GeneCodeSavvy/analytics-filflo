import type { UserRef } from "../../types/tickets";
import { initials } from "../../lib/ticketsComponent";
import { cn } from "../../lib/utils";

type AvatarProps = {
  user?: Partial<UserRef> | null;
  className?: string;
};

export function Avatar({ user, className = "" }: AvatarProps) {
  const name = user?.name ?? "Unassigned";
  const avatarClassName = cn(
    "relative h-6 w-6 shrink-0 rounded-full border-2 border-background object-cover",
    className,
  );

  return user?.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className={avatarClassName} />
  ) : (
    <span
      className={cn(
        avatarClassName,
        "inline-flex items-center justify-center bg-muted font-mono text-[10px] leading-none text-muted-foreground",
      )}
    >
      {initials(name)}
    </span>
  );
}
