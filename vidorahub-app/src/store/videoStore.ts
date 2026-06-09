import { create } from 'zustand';
import type { VideoItem } from '@/types';

type VideoState = {
  currentVideoId: string | null;
  muted: boolean;
  playbackProgress: Record<string, number>;
  setCurrentVideoId: (id: string | null) => void;
  setMuted: (muted: boolean) => void;
  setProgress: (videoId: string, seconds: number) => void;
  getProgress: (videoId: string) => number;
};

export const useVideoStore = create<VideoState>((set, get) => ({
  currentVideoId: null,
  muted: true,
  playbackProgress: {},

  setCurrentVideoId: (id) => set({ currentVideoId: id }),
  setMuted: (muted) => set({ muted }),
  setProgress: (videoId, seconds) =>
    set((s) => ({
      playbackProgress: { ...s.playbackProgress, [videoId]: seconds },
    })),
  getProgress: (videoId) => get().playbackProgress[videoId] ?? 0,
}));

type ChatState = {
  activeConversationId: string | null;
  typingUsers: Record<string, boolean>;
  setActiveConversation: (id: string | null) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  typingUsers: {},
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setTyping: (userId, isTyping) =>
    set((s) => ({
      typingUsers: { ...s.typingUsers, [userId]: isTyping },
    })),
}));

type MarketplaceState = {
  selectedCampaignId: string | null;
  setSelectedCampaign: (id: string | null) => void;
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  selectedCampaignId: null,
  setSelectedCampaign: (id) => set({ selectedCampaignId: id }),
}));

export type { VideoItem };
