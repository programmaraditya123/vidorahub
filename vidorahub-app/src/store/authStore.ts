import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import { mmkvStorage } from '@/lib/storage/mmkv';
import {
  getSecureToken,
  removeSecureToken,
  setSecureToken,
} from '@/lib/storage/secureStore';
import type { User } from '@/types';

type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  redirectAfterLogin: string | null;
  hydrate: () => Promise<void>;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setRedirectAfterLogin: (path: string | null) => void;
  consumeRedirect: () => string | null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  redirectAfterLogin: null,

  hydrate: async () => {
    const token = await getSecureToken();
    const userName = mmkvStorage.getString(STORAGE_KEYS.USER_NAME);
    const userSerialNumber = mmkvStorage.getString(STORAGE_KEYS.USER_SERIAL_NUMBER);
    const redirect = mmkvStorage.getString(STORAGE_KEYS.REDIRECT_AFTER_LOGIN) ?? null;

    if (token && userName && userSerialNumber) {
      set({
        token,
        user: { name: userName, email: '', userSerialNumber },
        isAuthenticated: true,
        isHydrated: true,
        redirectAfterLogin: redirect,
      });
    } else {
      set({ isHydrated: true, redirectAfterLogin: redirect });
    }
  },

  login: async (token, user) => {
    await setSecureToken(token);
    mmkvStorage.set(STORAGE_KEYS.USER_NAME, user.name);
    mmkvStorage.set(STORAGE_KEYS.USER_SERIAL_NUMBER, user.userSerialNumber);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await removeSecureToken();
    mmkvStorage.delete(STORAGE_KEYS.USER_NAME);
    mmkvStorage.delete(STORAGE_KEYS.USER_SERIAL_NUMBER);
    set({ token: null, user: null, isAuthenticated: false });
  },

  setRedirectAfterLogin: (path) => {
    if (path) {
      mmkvStorage.set(STORAGE_KEYS.REDIRECT_AFTER_LOGIN, path);
    } else {
      mmkvStorage.delete(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
    }
    set({ redirectAfterLogin: path });
  },

  consumeRedirect: () => {
    const redirect = get().redirectAfterLogin;
    mmkvStorage.delete(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
    set({ redirectAfterLogin: null });
    return redirect;
  },
}));

export function userValidates(): boolean {
  const { isAuthenticated, user } = useAuthStore.getState();
  return isAuthenticated && Boolean(user?.name);
}
