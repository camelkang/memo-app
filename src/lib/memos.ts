import { useSyncExternalStore } from 'react';
import { loadVault, saveVault } from './vault';

export type Memo = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
};

export type MemoStatus = 'loading' | 'ready' | 'error';

let memos: Memo[] = [];
let status: MemoStatus = 'loading';
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

loadVault().then(
  (json) => {
    memos = json ? (JSON.parse(json) as Memo[]) : [];
    status = 'ready';
    notify();
  },
  () => {
    // Saving is blocked in this state so unreadable memos are never overwritten.
    status = 'error';
    notify();
  },
);

// Encrypting takes a moment, so saves run one at a time and always write the latest list.
let saving = false;
let dirty = false;

async function persist() {
  if (saving) {
    dirty = true;
    return;
  }
  saving = true;
  do {
    dirty = false;
    try {
      await saveVault(JSON.stringify(memos));
    } catch {
      // The memos stay in memory; the next edit tries to save again.
    }
  } while (dirty);
  saving = false;
}

function commit(next: Memo[]) {
  if (status !== 'ready') return;
  memos = next;
  notify();
  persist();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMemoStatus(): MemoStatus {
  return useSyncExternalStore(subscribe, () => status);
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

export type MemoSection = { title: string; data: Memo[] };

/** Groups memos (already newest first) under 오늘 / 어제 / 이번 주 / 이전. */
export function groupByDate(list: Memo[]): MemoSection[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = 24 * 60 * 60 * 1000;
  const today = startOfToday.getTime();
  const buckets: MemoSection[] = [
    { title: '오늘', data: [] },
    { title: '어제', data: [] },
    { title: '이번 주', data: [] },
    { title: '이전', data: [] },
  ];
  for (const memo of list) {
    const index =
      memo.updatedAt >= today ? 0 : memo.updatedAt >= today - day ? 1 : memo.updatedAt >= today - 6 * day ? 2 : 3;
    buckets[index].data.push(memo);
  }
  return buckets.filter((bucket) => bucket.data.length > 0);
}

/** All memos as plain text, for exporting out of the app. */
export function memosToText(list: Memo[]) {
  return list
    .map((memo) => `${new Date(memo.updatedAt).toLocaleString('ko-KR')}\n${memo.text.trim()}`)
    .join('\n\n────────\n\n');
}
