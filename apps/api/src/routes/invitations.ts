import { Router } from "express";
import { verifyInvitation } from "../controllers/invitations/verify";

const invitationsRouter: Router = Router();

invitationsRouter.get("/:token", verifyInvitation);

export default invitationsRouter;
