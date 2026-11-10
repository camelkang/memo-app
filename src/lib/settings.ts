import { useSyncExternalStore } from 'react';

import { readItem, writeItem } from './storage';

export type Settings = {
  /** Ask for fingerprint, face or the phone's PIN when the app opens. */
  lockEnabled: boolean;
};

const STORAGE_KEY = 'settings.v1';
const DEFAULTS: Settings = { lockEnabled: true };

let settings: Settings = load();
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const raw = readItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => settings);
}

export function updateSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch };
  writeItem(STORAGE_KEY, JSON.stringify(settings));
  listeners.forEach((listener) => listener());
}
