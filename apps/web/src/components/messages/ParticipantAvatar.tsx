import { User } from "lucide-react";
import { cn } from "../../lib/utils";
import type { MessageParticipantAvatarProps } from "../../types/messages";

export function ParticipantAvatar({
  user,
  index,
}: MessageParticipantAvatarProps) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full border border-[--border-default] bg-[--surface-card] text-[--ink-2] shadow-[--elev-1]",
        index > 0 && "-ml-2",
      )}
      title={user.name}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="size-full rounded-full object-cover"
        />
      ) : (
        <User className="size-3.5" />
      )}
    </span>
  );
}
