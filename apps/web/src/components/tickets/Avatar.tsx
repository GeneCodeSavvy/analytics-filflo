import type { UserRef } from "../../types/tickets";
import { initials } from "../../lib/ticketsComponent";

type AvatarProps = {
  user?: Partial<UserRef> | null;
  className?: string;
};

export function Avatar({ user, className = "" }: AvatarProps) {
  const name = user?.name ?? "Unassigned";
  return user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      className={`tickets-avatar ${className}`}
    />
  ) : (
    <span className={`tickets-avatar tickets-avatar-fallback ${className}`}>
      {initials(name)}
    </span>
  );
}
