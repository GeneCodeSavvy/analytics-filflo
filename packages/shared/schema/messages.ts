import { z } from "zod";
import { UserRefSchema } from "./user";

export const MessageKindSchema = z.enum([
  "user_message",
  "system_event",
  "file_attachment",
]);

export const SystemEventKindSchema = z.enum([
  "status_change",
  "priority_change",
  "assignee_added",
  "assignee_removed",
  "ticket_created",
]);

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  kind: MessageKindSchema,
  sender: UserRefSchema,
  at: z.string(),
  content: z.string().optional(),
  mentions: UserRefSchema.array().optional(),
  ticketRefs: z.string().array().optional(),
  file: z
    .object({
      name: z.string(),
      size: z.number(),
      mimeType: z.string(),
      url: z.string(),
      thumbnailUrl: z.string().optional(),
    })
    .optional(),
  eventKind: SystemEventKindSchema.optional(),
  eventDescription: z.string().optional(),
});

export const ThreadListRowSchema = z.object({
  id: z.string(),
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    status: z.string(),
    priority: z.string(),
    orgId: z.string(),
    orgName: z.string(),
  }),
  lastMessage: z.object({
    snippet: z.string(),
    senderName: z.string(),
    at: z.string(),
    isSystemEvent: z.boolean(),
  }),
  unreadCount: z.number(),
  participantsPreview: UserRefSchema.array(),
  participantCount: z.number(),
  isUnanswered: z.boolean(),
  isMuted: z.boolean(),
});

export const ThreadSchema = z.object({
  id: z.string(),
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    status: z.string(),
    priority: z.string(),
    orgId: z.string(),
    orgName: z.string(),
  }),
  participants: UserRefSchema.array(),
  permissions: z.object({
    canSend: z.boolean(),
    canAddParticipants: z.boolean(),
    canJoin: z.boolean(),
    canMute: z.boolean(),
  }),
});

export const MessageFiltersSchema = z.object({
  tab: z.enum(["all", "unread", "mine", "org"]).default("all"),
  orgId: z.string().optional(),
  q: z.string().optional(),
});

export const MessagePageParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().default(50),
});

export const SendMessagePayloadSchema = z.object({
  content: z.string().optional(),
  mentionIds: z.string().array().optional(),
  ticketRefs: z.string().array().optional(),
  fileIds: z.string().array().optional(),
});

export const AddParticipantPayloadSchema = z.object({
  userId: z.string(),
});

export const FileUploadResponseSchema = z.object({
  fileId: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
});

export const MessagesPageSchema = z.object({
  messages: MessageSchema.array(),
  nextCursor: z.string().optional(),
});

export const ThreadListSchema = ThreadListRowSchema.array();
export const ParticipantsSchema = UserRefSchema.array();

export const IdParamsSchema = z.object({
  id: z.string().min(1),
});

export const ThreadMessageParamsSchema = z.object({
  threadId: z.string().min(1),
  messageId: z.string().min(1).optional(),
});

export const ThreadFileParamsSchema = z.object({
  threadId: z.string().min(1),
  fileId: z.string().min(1).optional(),
});

export const EmptyResponseSchema = z.object({
  ok: z.literal(true),
});

export type MessageKind = z.infer<typeof MessageKindSchema>;
export type SystemEventKind = z.infer<typeof SystemEventKindSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ThreadListRow = z.infer<typeof ThreadListRowSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type MessageFilters = z.infer<typeof MessageFiltersSchema>;
export type MessagePageParams = z.infer<typeof MessagePageParamsSchema>;
export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
export type AddParticipantPayload = z.infer<typeof AddParticipantPayloadSchema>;
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
export type MessagesPage = z.infer<typeof MessagesPageSchema>;
export type ThreadList = z.infer<typeof ThreadListSchema>;
export type Participants = z.infer<typeof ParticipantsSchema>;
export type IdParams = z.infer<typeof IdParamsSchema>;
export type ThreadMessageParams = z.infer<typeof ThreadMessageParamsSchema>;
export type ThreadFileParams = z.infer<typeof ThreadFileParamsSchema>;
export type EmptyResponse = z.infer<typeof EmptyResponseSchema>;
