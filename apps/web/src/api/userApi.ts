import type { UserRef } from '../lib/ticketParams';
import { api } from '.';

export const userApi = {
  search: (q: string, orgId?: string, signal?: AbortSignal): Promise<UserRef[]> =>
    api.get<UserRef[]>('/users/search', { params: { q, orgId }, signal }),
};
