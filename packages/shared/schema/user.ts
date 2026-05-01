import { z } from "zod";

export const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
  role: z.string(),
  orgId: z.string(),
});

export type UserRef = z.infer<typeof UserRefSchema>;
