import type { UserRef } from "../types/tickets";
import { api } from ".";

export const userApi = {
  search: (
    q: string,
    orgId?: string,
    signal?: AbortSignal,
  ): Promise<UserRef[]> =>
    api.get<UserRef[]>("/users/search", { params: { q, orgId }, signal }),
};
