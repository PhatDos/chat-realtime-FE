import { create } from "zustand";

export type PresenceMap = Record<string, boolean>;

interface PresenceStore {
  presence: PresenceMap;
  mergePresence: (nextPresence: PresenceMap) => void;
  setPresenceStatus: (profileId: string, isOnline: boolean) => void;
  resetPresence: () => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  presence: {},
  mergePresence: (nextPresence) =>
    set((state) => ({
      presence: { ...state.presence, ...nextPresence },
    })),
  setPresenceStatus: (profileId, isOnline) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [profileId]: isOnline,
      },
    })),
  resetPresence: () => set({ presence: {} }),
}));

const presenceRequestCache = new Map<string, Promise<PresenceMap>>();

const normalizeProfileIds = (profileIds: string[]) =>
  Array.from(new Set(profileIds.filter(Boolean)));

export const getPresenceRequestKey = (profileIds: string[]) =>
  normalizeProfileIds(profileIds).sort().join(",");

export const fetchPresenceMap = async (
  api: {
    post: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  },
  profileIds: string[]
): Promise<PresenceMap> => {
  const uniqueIds = normalizeProfileIds(profileIds);
  if (uniqueIds.length === 0) return {};

  const requestKey = getPresenceRequestKey(uniqueIds);
  const cachedRequest = presenceRequestCache.get(requestKey);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = api
    .post<{ data: PresenceMap }>("/presence/bulk", { profileIds: uniqueIds })
    .then((response) => response?.data ?? {})
    .finally(() => {
      presenceRequestCache.delete(requestKey);
    });

  presenceRequestCache.set(requestKey, request);
  return request;
};