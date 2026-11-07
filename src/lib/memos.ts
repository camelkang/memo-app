import { useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';

export type Memo = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
};

// All memos live as one JSON array under this key, on the phone only.
const STORAGE_KEY = 'memos.v1';

let memos: Memo[] = load();
const listeners = new Set<() => void>();

function load(): Memo[] {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Memo[]) : [];
  } catch {
    return [];
  }
}

function commit(next: Memo[]) {
  memos = next;
  Storage.setItemSync(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** All memos, newest edit first. */
export function useMemos(): Memo[] {
  return useSyncExternalStore(subscribe, () => memos);
}

export function useMemoById(id: string | undefined): Memo | undefined {
  const all = useMemos();
  return all.find((memo) => memo.id === id);
}

export function createMemo(text: string): Memo {
  const now = Date.now();
  const memo: Memo = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: now,
    updatedAt: now,
  };
  commit([memo, ...memos]);
  return memo;
}

export function updateMemo(id: string, text: string) {
  const current = memos.find((memo) => memo.id === id);
  if (!current || current.text === text) return;
  const updated = { ...current, text, updatedAt: Date.now() };
  commit([updated, ...memos.filter((memo) => memo.id !== id)]);
}

export function deleteMemo(id: string) {
  commit(memos.filter((memo) => memo.id !== id));
}

/** First non-empty line is the title; the next one is the preview. */
export function splitMemo(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return { title: lines[0] ?? '새 메모', preview: lines[1] ?? '' };
}

export function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('ko-KR', {
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
