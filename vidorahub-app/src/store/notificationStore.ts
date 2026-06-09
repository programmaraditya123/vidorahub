import { create } from 'zustand';

type NotificationState = {
  unreadCount: number;
  pushToken: string | null;
  setUnreadCount: (count: number) => void;
  setPushToken: (token: string | null) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  pushToken: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setPushToken: (token) => set({ pushToken: token }),
}));
