## Ideation Phase Comments
- Easier to follow up on Tickets.
- Admins can ask for more details for the Ticket Raised to the User.
- All the Super Admins, and Moderators have access to relevant chats.
- Super Admin can add Admins to the chat, and Moderators can add Users to the chat
- Just like whatsApp group.

# After Brain Strom Comments
Messages is the feature teams add as an afterthought and then realize should have been a first-class citizen from the start. Your spec treats it as a WhatsApp group bolted onto tickets — that's actually the right instinct, but the details matter a lot. The gap between "chat that's attached to a ticket" and "chat that makes the ticket better" is an interaction design problem, not a backend one.

## The core mental model: ticket-scoped threads, not a messaging app

The framing "just like WhatsApp group" is useful for understanding the access model but dangerous as a design north star. WhatsApp is a general communication tool. Your messages page has a narrow job: **accelerate ticket resolution by giving everyone on a ticket a shared, persistent, searchable conversation**.

That focus changes several decisions. You don't need channels, you don't need reactions (probably), you don't need a DM system, and you definitely don't need a "status" indicator showing who's online. What you need is a list of ticket threads on the left, a conversation view on the right, and enough context surfaced inside the conversation to make it unnecessary to switch between the ticket and the chat.

The closest real-world reference is **Linear's comment threads + Intercom's conversation view** — not WhatsApp. Linear's model is right: comments/messages live *on* the ticket and the ticket's detail panel shows both the fields and the conversation. Intercom's model is right for the messages list: it's a triageable inbox of conversations, not a persistent sidebar of channels.

## Access model — clarifying the spec

Your spec says "Super Admins and Moderators have access to relevant chats." "Relevant" needs a definition before you build anything:

- **Super Admin:** access to all message threads across all orgs. The word "all" sounds scary — it's not, because threads are ticket-scoped. Super Admins already have visibility into all tickets, so the threads attached to those tickets are just an extension of that.
- **Admin:** access to threads on tickets assigned to them. They can't see threads on tickets that have nothing to do with them.
- **Moderator:** access to all threads on tickets within their org — regardless of whether they created the ticket or were explicitly invited. Their role is to oversee their org; the thread is part of that ticket.
- **User:** access only to threads on tickets they created or were explicitly invited to.

The invitation mechanic — Super Admin adds Admins, Moderators add Users — maps onto how assignees work in the ticket model. The natural implementation is: when someone is added to a ticket (as assignee or invitee), they're implicitly added to that ticket's thread. No separate "add to chat" action needed in most cases.

## The messages list (left panel)

The messages page is a list of threads. Not "all messages ever" — a list of conversations the current user is party to. Each row in the list needs:

- **Ticket ID and subject** (the unit of conversation is the ticket, always)
- **Snippet of the last message**, truncated, with sender name — same pattern as Gmail/Intercom
- **Unread indicator** — bold row, colored dot, or both. Unread count if >1 unread in the thread
- **Timestamp** of the last message
- **Priority badge** from the parent ticket — HIGH / MEDIUM / LOW. A message on a HIGH priority ticket deserves more visual weight than one on a LOW priority ticket
- **Status badge** from the parent ticket — IN PROGRESS, ON HOLD, etc. Closed/resolved threads should be visually demoted (grayed out, pushed to the bottom)

Sort order: **unread first, then by last message timestamp**. Not alphabetical, not by ticket creation date — by recency of conversation activity, with unread priority.

Filtering above the list: `All · Unread · Mine (assigned to me) · Org (moderator view)`. A search box that searches across message content and ticket IDs — the thing you need when you remember a conversation happened but can't find which ticket it was on.

## The thread view (right panel)

Standard split view — list left, thread right. On mobile, stack them (list → back button → thread). This is the universal pattern and there's no reason to deviate from it here.

Inside the thread view, the top bar matters more than most products make it. It should show:
- **Ticket ID, subject, status pill, and priority** — never make someone switch to the tickets page to remember what the ticket is about
- **Participants list** as overlapping avatars — who's in this conversation
- **"Go to ticket" link** — one click to jump to the full ticket detail (the drawer or full-page view from the Tickets page)

This context bar turns the messages page from "a chat app attached to tickets" into "a conversation that knows what it's about." The equivalent in Intercom is the customer details panel on the right — it answers "who is this person and what's their situation" without leaving the conversation.

## Conversation mechanics

**Message threading vs flat messages** — flat for now. Threading (reply-to) adds complexity and the use case (ticket follow-up conversations) doesn't require it. If a thread gets long enough that you need threading, the ticket itself has grown too complex and should probably be split. Flat + scroll is fine.

**Message types** worth distinguishing visually:
- **User messages** (typed text) — the standard chat bubble
- **System messages** ("Admin X was assigned this ticket", "Status changed to REVIEW") — muted, centered, smaller text. These are the audit trail of what happened to the ticket and they belong in the thread because they give context to the conversation
- **File attachments** — drag-and-drop onto the input, or a clip icon. Screenshots and documents are common in support contexts. Show preview thumbnails for images; file icon + name + size for documents

**System messages are the secret weapon.** If you pipe the ticket's activity log (status changes, assignee changes, priority changes) into the message thread as system events, the thread becomes a complete record of the ticket's lifecycle. Admins asking for "more details" can see exactly what happened and when without leaving the conversation. This is how Intercom and Zendesk handle it and it's strictly better than keeping the ticket history separate from the conversation.

## Composition area

Text input at the bottom, fixed, not expanding-to-infinity. A few affordances:

- **@mention** with autocomplete of thread participants — fires a notification to the mentioned person specifically (the "mention" notification type from your notifications spec)
- **Ticket reference** with `#` + ticket ID — linkifies to that ticket's detail page. Especially useful when conversations span multiple related tickets
- **File attachment** — clip icon or drag-and-drop onto the composer
- **`Cmd/Ctrl+Enter` to send** — industry standard, don't make them hunt for a send button
- **Draft persistence** — if they close and reopen, the draft is still there. Cheap to store in localStorage, high delight

What to skip: reactions (not a social app), formatting toolbar (markdown shorthand is enough for a support context), voice messages (scope creep).

## Role-specific experience

**Super Admin:** the messages list is potentially large — threads from all orgs. The org filter chip above the list is essential. Also consider a "needs my attention" filter that shows only threads where the Super Admin has been @mentioned or there's been a message since they last viewed the thread. This is the same "action required" distinction from the notifications design — not all threads are equal.

**Admin:** the cleanest experience. Their list is a focused inbox of threads on their assigned tickets. This should feel like a focused to-do list of conversations that need their reply. Make "most recent unanswered" (thread where the last message is from a User/Moderator, not from the Admin) visually distinct — it's the thing they should respond to next.

**Moderator:** similar to Super Admin but org-scoped. They can see all threads in their org, which means they can jump in if the assigned Admin is unresponsive. This "backup moderator" pattern is valuable in practice — give them a `+1 Moderator` join button on threads they're not formally part of.

**User:** sees only their own ticket threads. This list should be very short. Consider whether they need the full split-view layout at all — a simple list of "conversations on my tickets" with a full-screen thread view might be friendlier than the power-user split panel.

## Real-time delivery

Messages require real-time. A ticketing system where your message appears 30 seconds after you send it is a failed product. You need WebSocket connections for the thread view — not optional. The spec already implies this (notifications fire on "any message activity").

Pragmatic implementation order:
1. WebSocket for **the open thread** (messages appear instantly when you're looking at the thread)
2. **Badge update on the messages nav item** (unread count ticks up)
3. **List row update** (latest message snippet and timestamp refresh without reload)
4. **Notification system integration** (the bell gets a ping and the notifications page gets an entry)

Polling is not acceptable for messages the way it is for the dashboard. Users expect sub-second delivery.

Typing indicators ("Admin X is typing...") are a nice touch — cheap if your WebSocket layer already has presence, expensive if it doesn't. Skip for v1.

## The relationship between Messages and Notifications

Your notifications spec says "any message activity → all parties involved get a notification." Be specific about what triggers it:

- First message in a thread after a period of silence (say, 30 minutes): notify all parties
- @mention: always notify the mentioned person immediately
- Reply to a thread where you sent the last message: notify you (someone responded)
- Don't notify for every single message if the conversation is active — notification fatigue kills this

The messages page and the notifications bell are two surfaces for the same underlying data. The bell is for "something happened while I wasn't looking." The messages page is the full context. Design them to complement: the notification popover row for a message event should have an "Open thread" button that deep-links directly to that thread in the messages page, scrolled to the unread point.

## What I'd cut

- **Direct messages between users.** Your spec doesn't mention DMs and the use case doesn't need them. All communication should be ticket-contextual. If someone needs to talk to another user privately, they have email. Adding a DM layer turns your support tool into a chat app and adds significant scope for minimal support value.
- **Read receipts.** In a professional support context, "did they see it?" creates anxiety without payoff. Seen indicators work in personal messaging; in a support context, the right signal is "did they respond?" not "did they see it?"
- **Message reactions.** Same category as read receipts — adds social dynamics to a professional task tool. A quick "👍" seems harmless but it fragments responses and makes conversation history harder to parse for audit purposes.
- **Thread pinning or starring.** This is scope creep. If a message is important enough to pin, the right action is to update the ticket's description or put the conclusion in the ticket's activity log.

## The shortest summary

Ticket-scoped threads with system events piped in, split-view layout with ticket context in the header, @mentions, file attachments, WebSocket delivery, and role-aware filtering are the core. The messages page isn't a chat product — it's a conversation layer that makes tickets more navigable. Keep that constraint and every feature decision becomes clearer.

---

# Final Specification

## 1. Route & Layout

- Route: `/messages`
- URL state: `/messages?tab=all&orgId=&q=&thread=<threadId>`
- Selected thread encoded in `?thread=` — direct-linking a thread loads the list in the background with the thread open.

Layout: **split view** — thread list left, thread view right.

```
┌─────────────────┬───────────────────────────────────┐
│  Thread List    │  Thread View                      │
│  (320px)        │  (flex fill)                      │
│                 │                                   │
│  [filters]      │  [ticket context bar]             │
│  [search]       │  [message feed]                   │
│  [thread rows]  │  [composition area]               │
└─────────────────┴───────────────────────────────────┘
```

Mobile: stacked. List is the default view; tapping a row navigates to full-screen thread with a back button.

**User role exception:** no split-view. Card list of threads → full-screen thread. The power-user layout adds no value when the list has <10 items.

## 2. Access Model

Thread access inherits from ticket access — no separate "add to chat" gate in most cases. Adding someone to a ticket (as assignee or invitee) implicitly grants them thread access.

| Role | Thread access |
|------|--------------|
| Super Admin | All threads across all orgs |
| Admin | Threads on tickets assigned to them |
| Moderator | All threads on tickets within their org |
| User | Threads on tickets they created or were explicitly invited to |

Invitation mechanic: Super Admin can add Admins to a ticket (and thus its thread); Moderators can add Users.

## 3. Thread List (Left Panel)

Each thread row:

- **Ticket subject** (bold if unread) + `#id` in monospace
- **Last message snippet** (~80 chars truncated) with sender name prefix — e.g. `Jana: Can you share the...`
- **Unread indicator**: colored left border + unread count badge if >1
- **Timestamp** of last message (relative, tooltip = absolute)
- **Priority badge**: small colored dot — HIGH `#EF4444`, MEDIUM `#F59E0B`, LOW `#9CA3AF`
- **Status badge**: small pill matching the ticket status palette

Sort order: unread first, then by `lastMessageAt` descending. Resolved/closed threads pushed to the bottom (visually dimmed).

**Filter bar above list:**

- Tabs: `All · Unread · Mine · Org` (Org tab visible to Moderator and Super Admin only)
- Search input: searches message content and ticket IDs/subjects. Slash-key focuses.

**Admin-specific:** rows where the last message is from a User or Moderator (i.e., the Admin has not yet replied) get a visual "needs reply" left accent in amber. This is the "most recent unanswered" distinction.

## 4. Thread View (Right Panel)

**Context bar (top, always visible):**

- Ticket ID (`#ab12cd3f`, monospace, copy-on-hover), subject, status pill, priority chip
- Participants as overlapping avatar stack (`+N` if >3). Hover shows full list.
- `Go to ticket` link → opens the ticket detail drawer on `/tickets/:ticketId`
- `⋯` overflow: mute thread (Moderator), add participant

**Message feed:**

- Chronological, oldest at top, newest at bottom. Auto-scroll to bottom on open.
- Pagination: load older messages on scroll up (`cursor`-based, not page-based).
- Unread separator line: `── N unread messages ──` above the first unread message on open.

**Moderator join:** if a Moderator is not a formal participant of the thread but has access (same org), show a `+ Join conversation` button in the context bar instead of the composition area. Clicking adds them as a participant.

## 5. Message Types

Three visually distinct types in the feed:

| Type | Visual treatment |
|------|-----------------|
| `user_message` | Standard chat bubble, sender avatar + name above, timestamp |
| `system_event` | Muted, centered, small text — e.g. `Status changed to REVIEW by Jana · 2h ago` |
| `file_attachment` | Bubble with thumbnail (images) or file icon + name + size (documents) |

**System events are piped from ticket activity.** Every status change, priority change, assignee add/remove from the ticket's activity log appears as a `system_event` in the thread. This turns the thread into a complete record of the ticket's lifecycle — Admins asking for more details can see exactly what happened without switching to the ticket page.

Consecutive `system_event` items within 60 seconds collapse into a single row with a `+N` expand affordance to reduce noise.

## 6. Composition Area

Fixed at the bottom of the thread view. Single-line expanding to ~5 lines max.

- **@mention**: typing `@` opens an autocomplete dropdown of thread participants. Selecting notifies that person. Rendered as a pill in the sent message.
- **Ticket reference**: typing `#` + ticket ID linkifies to that ticket's detail page.
- **File attachment**: clip icon opens file picker; drag-and-drop onto the composer also works. Images show inline preview; documents show name + size. Multiple files per message allowed.
- **`Cmd/Ctrl+Enter` sends** from anywhere in the composer.
- **Draft persistence**: draft saved to `localStorage` keyed by `threadId`. Restored on reopen; cleared on send.

No formatting toolbar. Markdown shorthand (`**bold**`, `` `code` ``) renders in the sent message — no toolbar needed for a support context.

## 7. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` | Move focus to next thread in list |
| `k` | Move focus to previous thread in list |
| `Enter` | Open focused thread |
| `/` | Focus search input |
| `Escape` | Close thread (return to list on mobile) |
| `?` | Show keyboard shortcut reference |

## 8. Real-time

**WebSocket required for the thread view** — polling is not acceptable for messages. Users expect sub-second delivery.

Scope:

1. **Open thread**: new messages appear instantly via WebSocket (`/ws/messages/:threadId`). Optimistic send: message appends immediately on send, rolls back with toast if server rejects.
2. **Thread list**: `lastMessage` snippet and timestamp refresh without reload when a WebSocket event arrives for any thread the user is party to.
3. **Unread badge** on the messages nav item: ticks up when a new message arrives in a thread the user isn't currently viewing.
4. **Notification system**: message activity triggers a notification entry per the notifications spec — the bell popover "Open thread" button deep-links to `/messages?thread=<threadId>`.

Connection lifecycle: open WebSocket on mount of thread view, close on unmount. Reconnect with exponential backoff on drop.

Typing indicators: out of scope for v1 (requires presence layer).

## 9. Role Specifics

**Super Admin**
- Thread list spans all orgs. Org filter chip above list essential.
- "Needs my attention" filter: threads where Super Admin was @mentioned or has unread messages.
- No volume cap — grouping and filtering carry the load.

**Admin**
- Focused inbox: only threads on their assigned tickets.
- "Needs reply" accent (amber) on threads where last message is from User/Moderator.
- Cleanest experience of any role.

**Moderator**
- Sees all threads in their org.
- `+ Join conversation` button on threads they're not a formal participant of.
- Per-thread mute via `⋯` overflow. Muted threads receive no further notifications; manageable in `/settings/notifications`.

**User**
- Card-list layout (no split-view). Each card: ticket subject, status pill, last message snippet, unread badge.
- Tap → full-screen thread, back button returns to list.
- No filter bar (volume too low).

## 10. Empty & Edge States

| State | Treatment |
|-------|-----------|
| No threads at all | Illustration + "Your ticket conversations will appear here" |
| Filter / search yields zero | "No conversations match" + `Clear filters` link |
| Thread selected but fails to load | Inline retry in thread panel, preserve list state |
| Thread has no messages yet | "No messages yet. Start the conversation." with composer focused |
| User not yet a participant (Moderator join) | `+ Join conversation` CTA instead of composer |
| File upload fails | Inline error below attachment preview, retry option |

## 11. Out of Scope (v1)

- Direct messages between users (all communication is ticket-contextual)
- Read receipts (professional context; "did they reply?" is the right signal)
- Message reactions
- Thread pinning / starring
- Message editing or deletion
- Typing indicators (requires presence layer)
- @mention for users outside thread participants

## 12. Data Shapes

```ts
type ID = string; // nanoid

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
type Status = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface UserRef { id: ID; name: string; avatarUrl?: string; role: Role; orgId: ID; }

interface ThreadListRow {
  id: ID;                           // thread ID — 1:1 with ticketId
  ticket: {
    id: ID;
    subject: string;
    status: Status;
    priority: Priority;
    orgId: ID;
    orgName: string;
  };
  lastMessage: {
    snippet: string;                // ~80 chars server-trimmed
    senderName: string;
    at: string;                     // ISO
    isSystemEvent: boolean;         // system events shown differently in snippet
  };
  unreadCount: number;
  participantsPreview: UserRef[];   // up to 3
  participantCount: number;
  isUnanswered: boolean;            // last message from non-Admin; Admin view only
  isMuted: boolean;
}

type MessageKind = 'user_message' | 'system_event' | 'file_attachment';

type SystemEventKind =
  | 'status_change'
  | 'priority_change'
  | 'assignee_added'
  | 'assignee_removed'
  | 'ticket_created';

interface Message {
  id: ID;
  threadId: ID;
  kind: MessageKind;
  sender: UserRef;
  at: string;                       // ISO
  // user_message
  content?: string;                 // markdown source
  mentions?: UserRef[];
  ticketRefs?: ID[];                // #ticket linkifications
  // file_attachment
  file?: {
    name: string;
    size: number;                   // bytes
    mimeType: string;
    url: string;
    thumbnailUrl?: string;          // images only
  };
  // system_event
  eventKind?: SystemEventKind;
  eventDescription?: string;        // human-readable, e.g. "Status changed to REVIEW by Jana"
}

interface Thread {
  id: ID;
  ticket: {
    id: ID;
    subject: string;
    status: Status;
    priority: Priority;
    orgId: ID;
    orgName: string;
  };
  participants: UserRef[];
  messages: Message[];              // paginated; cursor-based
  nextCursor?: string;              // null = no older messages
  permissions: {
    canSend: boolean;
    canAddParticipants: boolean;
    canJoin: boolean;               // Moderator join mechanic
    canMute: boolean;
  };
}

interface MessageFilters {
  tab?: 'all' | 'unread' | 'mine' | 'org';
  orgId?: ID;                       // Super Admin / Moderator only
  q?: string;                       // searches message content + ticket IDs/subjects
}

interface SendMessagePayload {
  content?: string;
  mentionIds?: ID[];
  ticketRefs?: ID[];
  fileIds?: ID[];                   // pre-uploaded via file upload endpoint
}

// localStorage only — never sent to server
interface ThreadDraft {
  threadId: ID;
  content: string;
  savedAt: string;                  // ISO
}
```

## 13. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/messages` | List `ThreadListRow[]` — query params encode `MessageFilters`, `page`, `pageSize` |
| `GET` | `/api/messages/:threadId` | `Thread` with messages (most recent 50; cursor param for older) |
| `POST` | `/api/messages/:threadId/messages` | Send message — body `SendMessagePayload` |
| `POST` | `/api/messages/:threadId/read` | Mark thread as read — resets `unreadCount` to 0 |
| `POST` | `/api/messages/:threadId/participants` | Add participant — `{ userId: ID }` |
| `DELETE` | `/api/messages/:threadId/participants/:userId` | Remove participant |
| `POST` | `/api/messages/:threadId/join` | Moderator self-join (no userId needed) |
| `POST` | `/api/messages/:threadId/mute` | Mute thread for current user |
| `DELETE` | `/api/messages/:threadId/mute` | Unmute |
| `POST` | `/api/files/upload` | Pre-upload file → returns `{ fileId, url, thumbnailUrl? }` |
| `GET` | `/api/users/search?q=&threadId=` | @mention autocomplete scoped to thread participants |
| `WS` | `/ws/messages/:threadId` | Real-time message delivery for open thread |

## 14. Frontend State

- **URL = source of truth** for selected `threadId`, tab, `orgId`, `q`.
- React Query keyed by URL query for thread list — free dedupe + background refetch.
- Thread messages fetched separately, keyed by `threadId` + cursor.
- WebSocket connection: opened on `Thread` component mount, closed on unmount. New messages appended to React Query cache directly (no full refetch).
- Local-only state: composer draft (localStorage keyed by `threadId`), scroll position per thread.
- **Optimistic send**: message appended to cache immediately with a `pending` flag; flag cleared on server confirm; message removed + toast shown on server reject.
- Thread list `unreadCount` and `lastMessage` updated optimistically on read and on incoming WebSocket events.

