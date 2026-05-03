-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BUG', 'FEATURE_REQUEST');

-- CreateEnum
CREATE TYPE "TicketParticipantRole" AS ENUM ('REQUESTER', 'ASSIGNEE');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('USER_MESSAGE', 'FILE_ATTACHMENT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ViewScope" AS ENUM ('BUILTIN', 'USER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ROLE_CHANGED', 'REMOVED', 'INVITED', 'INVITATION_CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TICKET_ASSIGNED', 'REVIEW_REQUESTED', 'TICKET_INVITATION', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'NEW_TICKET_IN_ORG', 'MESSAGE_ACTIVITY');

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "defaultPriority" "TicketPriority" NOT NULL DEFAULT 'LOW',
    "defaultCategories" "TicketCategory" NOT NULL DEFAULT 'BUG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL,
    "orgId" TEXT NOT NULL,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'LOW',
    "category" "TicketCategory" NOT NULL DEFAULT 'BUG',
    "orgId" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketParticipant" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TicketParticipantRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketActivity" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "changes" JSONB,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "ViewScope" NOT NULL,
    "ownerId" TEXT,
    "role" "UserRole",
    "filters" JSONB NOT NULL,
    "sort" JSONB NOT NULL,
    "groupBy" TEXT,
    "columns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "lastMessageId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "kind" "MessageKind" NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReadState" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "lastReadMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReadState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTicketRef" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "MessageTicketRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageFile" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "MessageFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "orgId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT,
    "message" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetEmail" TEXT,
    "orgId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "fromRole" "UserRole",
    "toRole" "UserRole",
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "ticketId" TEXT,
    "threadId" TEXT,
    "messageId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Org_displayName_idx" ON "Org"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_displayName_idx" ON "User"("displayName");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Ticket_orgId_status_priority_idx" ON "Ticket"("orgId", "status", "priority");

-- CreateIndex
CREATE INDEX "Ticket_updatedAt_idx" ON "Ticket"("updatedAt");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "TicketParticipant_ticketId_role_isPrimary_idx" ON "TicketParticipant"("ticketId", "role", "isPrimary");

-- CreateIndex
CREATE INDEX "TicketParticipant_userId_role_idx" ON "TicketParticipant"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TicketParticipant_ticketId_userId_role_key" ON "TicketParticipant"("ticketId", "userId", "role");

-- CreateIndex
CREATE INDEX "TicketActivity_ticketId_createdAt_idx" ON "TicketActivity"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketActivity_actorId_createdAt_idx" ON "TicketActivity"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketView_scope_role_idx" ON "TicketView"("scope", "role");

-- CreateIndex
CREATE INDEX "TicketView_ownerId_idx" ON "TicketView"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_ticketId_key" ON "Thread"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_lastMessageId_key" ON "Thread"("lastMessageId");

-- CreateIndex
CREATE INDEX "Thread_lastMessageAt_idx" ON "Thread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReadState_userId_lastReadAt_idx" ON "MessageReadState"("userId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReadState_threadId_userId_key" ON "MessageReadState"("threadId", "userId");

-- CreateIndex
CREATE INDEX "MessageTicketRef_ticketId_idx" ON "MessageTicketRef"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTicketRef_messageId_ticketId_key" ON "MessageTicketRef"("messageId", "ticketId");

-- CreateIndex
CREATE INDEX "FileAsset_orgId_createdAt_idx" ON "FileAsset"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_uploadedById_createdAt_idx" ON "FileAsset"("uploadedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageFile_messageId_fileId_key" ON "MessageFile"("messageId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_orgId_status_idx" ON "Invitation"("orgId", "status");

-- CreateIndex
CREATE INDEX "Invitation_email_status_idx" ON "Invitation"("email", "status");

-- CreateIndex
CREATE INDEX "TeamAuditLog_orgId_createdAt_idx" ON "TeamAuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "TeamAuditLog_actorId_createdAt_idx" ON "TeamAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "TeamAuditLog_targetUserId_createdAt_idx" ON "TeamAuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx" ON "Notification"("recipientId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_ticketId_idx" ON "Notification"("ticketId");

-- CreateIndex
CREATE INDEX "Notification_threadId_idx" ON "Notification"("threadId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketParticipant" ADD CONSTRAINT "TicketParticipant_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketParticipant" ADD CONSTRAINT "TicketParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketParticipant" ADD CONSTRAINT "TicketParticipant_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketView" ADD CONSTRAINT "TicketView_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTicketRef" ADD CONSTRAINT "MessageTicketRef_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTicketRef" ADD CONSTRAINT "MessageTicketRef_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFile" ADD CONSTRAINT "MessageFile_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFile" ADD CONSTRAINT "MessageFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
