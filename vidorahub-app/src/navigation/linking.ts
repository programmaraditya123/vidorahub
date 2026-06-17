import { Linking } from 'react-native';
import { parseVideoSlug } from '@/utils';
import type { RootStackParamList, MainStackParamList } from './types';

const prefix = 'vidorahub://';

export const linking = {
  prefixes: [prefix, 'vidorahub://', 'https://www.vidorahub.com', 'https://vidorahub.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Tabs: {
            screens: {
              Home: '',
              Search: 'search',
              Vibes: {
                path: 'vibes',
                parse: {
                  initialVibeId: (v: string) => v,
                },
              },
              EarnTab: 'earn',
              ProfileTab: 'profile',
            },
          },
          VideoPlayer: {
            path: 'video/:slug',
            parse: {
              slug: (slug: string) => slug,
              videoId: (slug: string) => {
                try {
                  return parseVideoSlug(slug).videoId;
                } catch {
                  return slug.slice(-24);
                }
              },
            },
          },
          Channel: {
            path: 'channel/:id',
            parse: {
              tab: (tab: string) => (tab === 'store' ? 'store' : 'videos') as 'videos' | 'store',
            },
          },
          Earn: 'earnings',
          History: 'history',
          UploadChooser: 'upload',
          UploadVideo: 'uploadvideo',
          UploadVibe: 'uploadvibe',
          UploadDetails: 'upload/details',
          Login: 'login',
          Signup: 'signup',
        } satisfies Record<keyof MainStackParamList, unknown>,
      },
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
        },
      },
    } satisfies Record<keyof RootStackParamList, unknown>,
  },
};

export function buildVideoDeepLink(slug: string): string {
  return `${prefix}video/${slug}`;
}

export function buildChannelDeepLink(id: string, tab?: string): string {
  const base = `${prefix}channel/${id}`;
  return tab ? `${base}?tab=${tab}` : base;
}

export function buildVibeDeepLink(vibeId: string): string {
  return `${prefix}vibes?v=${vibeId}`;
}
