import type {
  Message,
  MessageFilters,
  Thread,
  ThreadListRow,
} from "@shared/schema/messages";

export { MessageKindSchema } from "@shared/schema/domain";
export type { MessageKind, UserRef } from "@shared/schema/domain";

export {
  MessageFileSchema,
  MessageSchema,
  ThreadListRowSchema,
  ThreadSchema,
  MessageFiltersSchema,
  MessagePageParamsSchema,
  SendMessagePayloadSchema,
  CreateThreadPayloadSchema,
  FileUploadResponseSchema,
  MessagesPageSchema,
  ThreadListSchema,
  ParticipantsSchema,
  ThreadMessageParamsSchema,
  ThreadFileParamsSchema,
} from "@shared/schema/messages";

export type {
  MessageFile,
  Message,
  ThreadListRow,
  Thread,
  MessageFilters,
  MessagePageParams,
  SendMessagePayload,
  CreateThreadPayload,
  FileUploadResponse,
  MessagesPage,
  ThreadList,
  Participants,
  IdParams,
  ThreadMessageParams,
  ThreadFileParams,
  EmptyResponse,
} from "@shared/schema/messages";

export type MessageFilterOption = {
  label: string;
  value: MessageFilters["tab"];
};

export type MessageBadgeProps = {
  value: string;
  tone: "status" | "priority";
};

export type MessageParticipantAvatarProps = {
  user: Thread["participants"][number];
  index: number;
};

export type MessageThreadRowProps = {
  row: ThreadListRow;
  active: boolean;
  onSelect: () => void;
};

export type MessageSystemMessageProps = {
  message: Message;
};

export type MessageFileAttachmentProps = {
  file: NonNullable<Message["file"]>;
};

export type MessageUserMessageProps = {
  message: Message;
  justSent: boolean;
};

export type MessageThreadHeaderProps = {
  thread: Thread;
};

export type MessageComposerProps = {
  value: string;
  disabled: boolean;
  sending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};
