import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { createMemo, useMemoStatus } from './memos';

/** Takes text shared from another app, if any, and saves it as a new memo. */
function saveSharedText() {
  if (Platform.OS === 'web') return;
  try {
    const text = Sharing.getSharedPayloads()
      .filter((payload) => payload.shareType === 'text' || payload.shareType === 'url')
      .map((payload) => payload.value.trim())
      .filter(Boolean)
      .join('\n');
    Sharing.clearSharedPayloads();
    if (!text) return;
    const memo = createMemo(text);
    router.push({ pathname: '/memo/[id]', params: { id: memo.id } });
  } catch {
    // Nothing was shared, or this phone doesn't support receiving shares.
  }
}

/**
 * Saves text shared into the app ("공유 → 꾹") as a new memo and opens it.
 * It is saved right away, even while the app is still locked.
 */
export function useSharedTextAsMemo() {
  const status = useMemoStatus();
  useEffect(() => {
    if (status !== 'ready') return;
    saveSharedText();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') saveSharedText();
    });
    return () => subscription.remove();
  }, [status]);
}
