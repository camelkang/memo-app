// Web: the browser's localStorage (expo-sqlite on web needs special server headers).
export function readItem(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Storage blocked (e.g. private mode): memos stay in memory for this visit.
  }
}
