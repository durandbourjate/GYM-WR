import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GCalCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
}

interface GCalState {
  clientId: string;
  setClientId: (id: string) => void;
  accessToken: string | null;
  tokenExpiry: number | null;
  setToken: (token: string, expiresIn: number) => void;
  clearToken: () => void;
  isAuthenticated: () => boolean;
  writeCalendarId: string | null;
  setWriteCalendarId: (id: string | null) => void;
  readCalendarIds: string[];
  toggleReadCalendar: (id: string) => void;
  calendars: GCalCalendar[];
  setCalendars: (cals: GCalCalendar[]) => void;
  // Event ID mapping: "weekKey-col" → Google Calendar eventId
  eventMap: Record<string, string>;
  setEventMapping: (key: string, eventId: string) => void;
  removeEventMapping: (key: string) => void;
  clearEventMap: () => void;
}

export const useGCalStore = create<GCalState>()(
  persist(
    (set, get) => ({
      clientId: '',
      setClientId: (id) => set({ clientId: id }),
      accessToken: null,
      tokenExpiry: null,
      setToken: (token, expiresIn) => set({
        accessToken: token,
        tokenExpiry: Date.now() + expiresIn * 1000,
      }),
      clearToken: () => set({
        accessToken: null,
        tokenExpiry: null,
        calendars: [],
      }),
      isAuthenticated: () => {
        const { accessToken, tokenExpiry } = get();
        return !!accessToken && !!tokenExpiry && tokenExpiry > Date.now();
      },
      writeCalendarId: null,
      setWriteCalendarId: (id) => set({ writeCalendarId: id }),
      readCalendarIds: [],
      toggleReadCalendar: (id) => set((s) => ({
        readCalendarIds: s.readCalendarIds.includes(id)
          ? s.readCalendarIds.filter(x => x !== id)
          : [...s.readCalendarIds, id],
      })),
      calendars: [],
      setCalendars: (cals) => set({ calendars: cals }),
      eventMap: {},
      setEventMapping: (key, eventId) => set((s) => ({
        eventMap: { ...s.eventMap, [key]: eventId },
      })),
      removeEventMapping: (key) => set((s) => {
        const { [key]: _, ...rest } = s.eventMap;
        return { eventMap: rest };
      }),
      clearEventMap: () => set({ eventMap: {} }),
    }),
    { name: 'gcal-config' }
  )
);
