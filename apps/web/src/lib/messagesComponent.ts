import type {
  Message,
  MessageFilterOption,
  ThreadListRow,
} from "../types/messages";

export const CURRENT_USER_ID = "usr-201";

export const filters: MessageFilterOption[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Assigned", value: "mine" },
  { label: "Org", value: "org" },
];

export const statusClasses: Record<string, string> = {
  OPEN: "border-zinc-300 bg-white text-zinc-700",
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-800",
  REVIEW: "border-zinc-300 bg-zinc-50 text-zinc-700",
  RESOLVED: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export const priorityClasses: Record<string, string> = {
  HIGH: "border-rose-300 bg-rose-50 text-rose-700",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-800",
  LOW: "border-zinc-300 bg-zinc-50 text-zinc-600",
};

export function formatRelative(value: string) {
  const then = new Date(value).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function sortThreadRows(rows: ThreadListRow[]) {
  return [...rows].sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    return (
      new Date(b.lastMessage.at).getTime() -
      new Date(a.lastMessage.at).getTime()
    );
  });
}

export function rendersAsSystemMessage(message: Message) {
  return message.kind === "FILE_ATTACHMENT" && !message.content;
}
