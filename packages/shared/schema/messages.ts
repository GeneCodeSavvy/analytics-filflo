import { z } from "zod";
import {
  EmptyResponseSchema,
  FileAssetSchema,
  IdParamsSchema,
  MessageKindSchema,
  TicketRefSchema,
  UserRefSchema,
} from "./domain";

export const MessageFileSchema = FileAssetSchema.pick({
  id: true,
  name: true,
  size: true,
  mimeType: true,
  url: true,
  thumbnailUrl: true,
});

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  kind: MessageKindSchema,
  sender: UserRefSchema,
  at: z.string(),
  content: z.string().optional(),
  ticketRefs: z.string().array().optional(),
  file: MessageFileSchema.optional(),
});

export const ThreadListRowSchema = z.object({
  id: z.string(),
  ticket: TicketRefSchema,
  lastMessage: z.object({
    snippet: z.string(),
    senderName: z.string(),
    at: z.string(),
  }),
  unreadCount: z.number(),
  participantsPreview: UserRefSchema.array(),
  participantCount: z.number(),
  isUnanswered: z.boolean(),
});

export const ThreadSchema = z.object({
  id: z.string(),
  ticket: TicketRefSchema,
  participants: UserRefSchema.array(),
  permissions: z.object({
    canSend: z.boolean(),
    canAddParticipants: z.literal(false).default(false),
    canJoin: z.literal(false).default(false),
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
  ticketRefs: z.string().array().optional(),
  fileIds: z.string().array().optional(),
});

export const CreateThreadPayloadSchema = z.object({
  ticketId: z.string().min(1),
});

export type CreateThreadPayload = z.infer<typeof CreateThreadPayloadSchema>;

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

export const ThreadMessageParamsSchema = z.object({
  threadId: z.string().min(1),
  messageId: z.string().min(1).optional(),
});

export const ThreadFileParamsSchema = z.object({
  threadId: z.string().min(1),
  fileId: z.string().min(1).optional(),
});

export type MessageKind = z.infer<typeof MessageKindSchema>;
export type MessageFile = z.infer<typeof MessageFileSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ThreadListRow = z.infer<typeof ThreadListRowSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type MessageFilters = z.infer<typeof MessageFiltersSchema>;
export type MessagePageParams = z.infer<typeof MessagePageParamsSchema>;
export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
export type MessagesPage = z.infer<typeof MessagesPageSchema>;
export type ThreadList = z.infer<typeof ThreadListSchema>;
export type Participants = z.infer<typeof ParticipantsSchema>;
export type IdParams = z.infer<typeof IdParamsSchema>;
export type ThreadMessageParams = z.infer<typeof ThreadMessageParamsSchema>;
export type ThreadFileParams = z.infer<typeof ThreadFileParamsSchema>;
export type EmptyResponse = z.infer<typeof EmptyResponseSchema>;
