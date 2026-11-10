import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytes } from 'expo-crypto';

import { type Memo } from './memos';

// A backup file is JSON text: the memos encrypted with AES-256-GCM, using a key
// stretched from the user's password. Nothing in the file is readable without it.
const ITERATIONS = 100_000;
export const MIN_PASSWORD_LENGTH = 8;

type BackupFile = {
  app: 'kkuk';
  version: 1;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  salt: string; // hex
  data: string; // base64: nonce + ciphertext + tag
};

export type RestoreError = 'not-a-backup' | 'wrong-password';

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const bytes = await pbkdf2Async(sha256, password.normalize('NFKC'), salt, { c: iterations, dkLen: 32 });
  return AESEncryptionKey.import(bytes);
}

export async function createBackup(memos: Memo[], password: string): Promise<string> {
  const salt = getRandomBytes(16);
  const key = await deriveKey(password, salt, ITERATIONS);
  const sealed = await aesEncryptAsync(new TextEncoder().encode(JSON.stringify(memos)), key);
  const file: BackupFile = {
    app: 'kkuk',
    version: 1,
    kdf: 'pbkdf2-sha256',
    iterations: ITERATIONS,
    salt: bytesToHex(salt),
    data: await sealed.combined('base64'),
  };
  return JSON.stringify(file);
}

/** True if the text looks like a backup made by this app. Does not check the password. */
export function isBackup(content: string) {
  return parse(content) !== undefined;
}

function parse(content: string): BackupFile | undefined {
  try {
    const file = JSON.parse(content) as Partial<BackupFile>;
    const valid =
      file.app === 'kkuk' &&
      file.version === 1 &&
      file.kdf === 'pbkdf2-sha256' &&
      typeof file.iterations === 'number' &&
      file.iterations >= 1 &&
      file.iterations <= 10_000_000 &&
      typeof file.salt === 'string' &&
      typeof file.data === 'string';
    return valid ? (file as BackupFile) : undefined;
  } catch {
    return undefined;
  }
}

function isMemo(value: unknown): value is Memo {
  const memo = value as Memo;
  return (
    typeof memo === 'object' &&
    memo !== null &&
    typeof memo.id === 'string' &&
    typeof memo.text === 'string' &&
    typeof memo.createdAt === 'number' &&
    typeof memo.updatedAt === 'number'
  );
}

export async function readBackup(
  content: string,
  password: string,
): Promise<{ memos: Memo[] } | { error: RestoreError }> {
  const file = parse(content);
  if (!file) return { error: 'not-a-backup' };
  try {
    const key = await deriveKey(password, hexToBytes(file.salt), file.iterations);
    const bytes = await aesDecryptAsync(AESSealedData.fromCombined(file.data), key);
    const list: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(list)) return { error: 'not-a-backup' };
    return { memos: list.filter(isMemo) };
  } catch {
    // GCM refuses to decrypt with the wrong key, so a failure here means the password is wrong.
    return { error: 'wrong-password' };
  }
}

export function backupFileName() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `kkuk-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.kkuk`;
}
