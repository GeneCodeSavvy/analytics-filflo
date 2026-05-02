import { Router } from "express";
import {
  bulkMembers,
  changeMemberRole,
  getMember,
  getMembers,
  moveMember,
  removeMember,
} from "../controllers/teams/members";
import {
  cancelInvitation,
  createInvitation,
  getAuditEntries,
  getInvitations,
  getOrgSummaries,
} from "../controllers/teams/invitations";

const teamsRouter: Router = Router();

teamsRouter.get("/members", getMembers);
teamsRouter.post("/members/bulk", bulkMembers);
teamsRouter.get("/members/:id", getMember);
teamsRouter.patch("/members/:id/role", changeMemberRole);
teamsRouter.patch("/members/:id/move", moveMember);
teamsRouter.delete("/members/:id", removeMember);
teamsRouter.get("/invitations", getInvitations);
teamsRouter.post("/invitations", createInvitation);
teamsRouter.delete("/invitations/:id", cancelInvitation);
teamsRouter.get("/audit", getAuditEntries);
teamsRouter.get("/orgs", getOrgSummaries);

export default teamsRouter;
