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
    }),
    { name: 'gcal-config' }
  )
);
