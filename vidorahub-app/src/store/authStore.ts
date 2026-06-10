import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import { mmkvStorage } from '@/lib/storage/mmkv';
import {
  getSecureToken,
  removeSecureToken,
  setSecureToken,
} from '@/lib/storage/secureStore';
import type { User } from '@/types';

function readStoredString(key: string): string | undefined {
  const stringValue = mmkvStorage.getString(key);
  if (stringValue !== undefined) return stringValue;

  const numberValue = mmkvStorage.getNumber(key);
  if (numberValue !== undefined) return String(numberValue);

  const booleanValue = mmkvStorage.getBoolean(key);
  if (booleanValue !== undefined) return String(booleanValue);

  return undefined;
}

function getUserId(user: User): string {
  return user.id ? String(user.id) : user._id ? String(user._id) : '';
}

function persistUser(user: User): void {
  const userId = getUserId(user);

  mmkvStorage.set(STORAGE_KEYS.USER_NAME, String(user.name ?? ''));
  mmkvStorage.set(STORAGE_KEYS.USER_EMAIL, String(user.email ?? ''));
  mmkvStorage.set(
    STORAGE_KEYS.USER_SERIAL_NUMBER,
    String(user.userSerialNumber ?? ''),
  );

  if (userId) {
    mmkvStorage.set(STORAGE_KEYS.USER_ID, userId);
  } else {
    mmkvStorage.delete(STORAGE_KEYS.USER_ID);
  }
}

function clearPersistedUser(): void {
  mmkvStorage.delete(STORAGE_KEYS.USER_NAME);
  mmkvStorage.delete(STORAGE_KEYS.USER_EMAIL);
  mmkvStorage.delete(STORAGE_KEYS.USER_SERIAL_NUMBER);
  mmkvStorage.delete(STORAGE_KEYS.USER_ID);
}

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
    const userName = readStoredString(STORAGE_KEYS.USER_NAME);
    const userEmail = readStoredString(STORAGE_KEYS.USER_EMAIL) ?? '';
    const userSerialNumber = readStoredString(STORAGE_KEYS.USER_SERIAL_NUMBER);
    const userId = readStoredString(STORAGE_KEYS.USER_ID);
    const redirect = readStoredString(STORAGE_KEYS.REDIRECT_AFTER_LOGIN) ?? null;

    if (token && userName && userSerialNumber) {
      set({
        token,
        user: {
          id: userId,
          _id: userId,
          name: userName,
          email: userEmail,
          userSerialNumber,
        },
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
    persistUser(user);
    set({
      token,
      user: {
        ...user,
        id: user.id ? String(user.id) : undefined,
        _id: user._id ? String(user._id) : undefined,
        name: String(user.name ?? ''),
        email: String(user.email ?? ''),
        userSerialNumber: String(user.userSerialNumber ?? ''),
      },
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await removeSecureToken();
    clearPersistedUser();
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
