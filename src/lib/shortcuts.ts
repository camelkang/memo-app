import { router } from 'expo-router';
import * as QuickActions from 'expo-quick-actions';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const NEW_MEMO = 'new-memo';

function openNewMemo(action: QuickActions.Action | undefined) {
  if (action?.id === NEW_MEMO) router.push({ pathname: '/memo/[id]', params: { id: 'new' } });
}

/** Adds "새 메모" to the menu shown when the app icon is long-pressed, and opens the editor from it. */
export function useNewMemoShortcut() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      QuickActions.setItems([{ id: NEW_MEMO, title: '새 메모' }]).catch(() => {});
      openNewMemo(QuickActions.initial);
      const subscription = QuickActions.addListener(openNewMemo);
      return () => subscription.remove();
    } catch {
      // This phone's launcher doesn't support shortcuts.
    }
  }, []);
}
