import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'vidorahub-storage' });

export const mmkvStorage = {
  getString: (key: string): string | undefined => storage.getString(key),
  set: (key: string, value: string | number | boolean) => storage.set(key, value),
  delete: (key: string) => storage.remove(key),
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  contains: (key: string): boolean => storage.contains(key),
  clearAll: () => storage.clearAll(),
};
