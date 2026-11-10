import Storage from 'expo-sqlite/kv-store';

// Native: SQLite-backed key-value store on the device.
export function readItem(key: string): string | null {
  return Storage.getItemSync(key);
}

export function writeItem(key: string, value: string) {
  Storage.setItemSync(key, value);
}

export function removeItem(key: string) {
  Storage.removeItemSync(key);
}
