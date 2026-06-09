import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

export async function getSecureToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export async function setSecureToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
}

export async function removeSecureToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
}
