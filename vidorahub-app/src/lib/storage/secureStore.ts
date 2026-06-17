import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '@/constants';

const TOKEN_SERVICE = STORAGE_KEYS.TOKEN;

export async function getSecureToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

export async function setSecureToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(STORAGE_KEYS.TOKEN, token, {
    service: TOKEN_SERVICE,
  });
}

export async function removeSecureToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}
