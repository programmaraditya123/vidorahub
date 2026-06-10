import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Vibes: { initialVibeId?: string } | undefined;
  EarnTab: undefined;
  ProfileTab: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  VideoPlayer: { slug: string; videoId?: string };
  Channel: { id: string; tab?: 'videos' | 'store' };
  Earn: undefined;
  History: undefined;
  UploadChooser: undefined;
  UploadVideo: undefined;
  UploadVibe: undefined;
  UploadDetails: {
    contentType: 'video' | 'vibe';
    videoUri: string;
    videoFileName: string;
    videoContentType: string;
    duration: number;
    sizeMb?: number;
  };
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
