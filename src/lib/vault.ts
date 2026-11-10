import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { readItem, removeItem, writeItem } from './storage';

// Memos are kept as one AES-256-GCM encrypted blob. The key never leaves the
// phone's keystore, so the database file alone can't be read.
const KEY_NAME = 'memos.key.v1';
const SEALED_KEY = 'memos.v2';
const PLAIN_KEY = 'memos.v1'; // Before encryption was added.

const KEY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let cachedKey: AESEncryptionKey | undefined;

async function storedKey(): Promise<AESEncryptionKey | undefined> {
  if (cachedKey) return cachedKey;
  const encoded = await SecureStore.getItemAsync(KEY_NAME, KEY_OPTIONS);
  if (encoded) cachedKey = await AESEncryptionKey.import(encoded, 'base64');
  return cachedKey;
}

async function storedOrNewKey(): Promise<AESEncryptionKey> {
  const existing = await storedKey();
  if (existing) return existing;
  const key = await AESEncryptionKey.generate();
  await SecureStore.setItemAsync(KEY_NAME, await key.encoded('base64'), KEY_OPTIONS);
  cachedKey = key;
  return key;
}

/** Returns the saved memos as JSON text, or null if nothing has been saved yet. */
export async function loadVault(): Promise<string | null> {
  const sealed = readItem(SEALED_KEY);
  if (sealed) {
    const key = await storedKey();
    // Never make a new key here: it would overwrite memos we can't read.
    if (!key) throw new Error('Encryption key is missing');
    const bytes = await aesDecryptAsync(AESSealedData.fromCombined(sealed), key);
    return new TextDecoder().decode(bytes);
  }

  const plain = readItem(PLAIN_KEY);
  if (plain) {
    await saveVault(plain);
    removeItem(PLAIN_KEY);
    return plain;
  }
  return null;
}

export async function saveVault(json: string) {
  const key = await storedOrNewKey();
  const sealed = await aesEncryptAsync(new TextEncoder().encode(json), key);
  writeItem(SEALED_KEY, await sealed.combined('base64'));
}
