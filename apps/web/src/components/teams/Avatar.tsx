import type { MemberRow } from "../../types/teams";
import { avatarTints, initials } from "../../lib/teamsComponent";

export function Avatar({ member, size = 32 }: { member: MemberRow; size?: number }) {
  const tint = avatarTints[member.name.length % avatarTints.length];
  return (
    <span
      className="inline-flex items-center justify-center flex-none rounded-full text-[#1A1917] font-bold text-[12px] overflow-hidden"
      style={{ width: size, height: size, backgroundColor: tint }}
    >
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        initials(member.name)
      )}
    </span>
  );
}
