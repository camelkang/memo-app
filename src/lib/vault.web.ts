import { readItem, writeItem } from './storage';

// Web is only a preview of the app: memos stay unencrypted in the browser.
const STORAGE_KEY = 'memos.v1';

export async function loadVault(): Promise<string | null> {
  return readItem(STORAGE_KEY);
}

export async function saveVault(json: string) {
  writeItem(STORAGE_KEY, json);
}
