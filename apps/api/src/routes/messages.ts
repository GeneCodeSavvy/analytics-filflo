import { Router } from "express";
import { deleteFile, uploadFile } from "../controllers/messages/files";
import {
  getMessages,
  markMessageRead,
  markThreadRead,
  sendMessage,
} from "../controllers/messages/messages";
import { joinThread } from "../controllers/messages/mutations";
import {
  getParticipants,
  getThread,
  getThreads,
} from "../controllers/messages/threads";

const messageRouter: Router = Router();

messageRouter.get("/", getThreads);
messageRouter.get("/:id", getThread);
messageRouter.patch("/:threadId/read", markThreadRead);
messageRouter.get("/:id/participants", getParticipants);
messageRouter.post("/:id/join", joinThread);
messageRouter.get("/:threadId/messages", getMessages);
messageRouter.post("/:threadId/messages", sendMessage);
messageRouter.patch("/:threadId/messages/:messageId/read", markMessageRead);
messageRouter.post("/:threadId/files", uploadFile);
messageRouter.delete("/:threadId/files/:fileId", deleteFile);

export default messageRouter;
