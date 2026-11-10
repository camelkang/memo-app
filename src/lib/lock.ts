import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useSettings } from './settings';

export type LockState = 'checking' | 'locked' | 'unlocked';

/**
 * Locks the app on launch and whenever it goes to the background.
 * Unlocking uses the phone's fingerprint/face, falling back to its PIN or pattern.
 * A phone with no screen lock at all cannot be locked, so the app stays open there.
 * The lock can also be turned off in settings.
 */
export function useAppLock() {
  const { lockEnabled } = useSettings();
  const enabled = useRef(lockEnabled);
  useEffect(() => {
    enabled.current = lockEnabled;
  }, [lockEnabled]);
  const [state, setState] = useState<LockState>('checking');
  const [biometric, setBiometric] = useState(false);
  const canLock = useRef(false);
  const prompting = useRef(false);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '꾹 열기',
        cancelLabel: '취소',
      });
      if (result.success) setState('unlocked');
    } finally {
      prompting.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let level = LocalAuthentication.SecurityLevel.NONE;
      try {
        level = await LocalAuthentication.getEnrolledLevelAsync();
      } catch {
        // Not available on this platform (e.g. web): leave the app unlocked.
      }
      if (cancelled) return;
      canLock.current = level !== LocalAuthentication.SecurityLevel.NONE;
      setBiometric(level > LocalAuthentication.SecurityLevel.SECRET);
      if (canLock.current && enabled.current) {
        setState('locked');
        unlock();
      } else {
        setState('unlocked');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background' && canLock.current && enabled.current) setState('locked');
    });
    return () => subscription.remove();
  }, []);

  return { state, biometric, unlock };
}

/** Asks for fingerprint, face or PIN once. True when the phone has no screen lock to ask with. */
export async function confirmIdentity(promptMessage: string) {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) return true;
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: '취소' });
    return result.success;
  } catch {
    return true;
  }
}
