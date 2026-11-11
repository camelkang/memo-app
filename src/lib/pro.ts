import { useMemos } from './memos';
import { updateSettings, useSettings } from './settings';

export const FREE_LIMIT = 50;
/** From this many memos on, the list shows how much of the free limit is left. */
export const WARN_FROM = 40;
export const PRO_PRICE = '5,900원';

export function useProStatus() {
  const { pro } = useSettings();
  const count = useMemos().length;
  return {
    pro,
    count,
    /** True when a free user can't add another memo. */
    full: !pro && count >= FREE_LIMIT,
    nearLimit: !pro && count >= WARN_FROM,
  };
}

/**
 * Buys Pro. Google Play billing is not connected yet, so in test builds this
 * simply turns Pro on. Replace the body with the real purchase before release.
 */
export async function purchasePro(): Promise<boolean> {
  updateSettings({ pro: true });
  return true;
}

/** Test builds only: go back to the free plan to try the limit again. */
export function resetProForTesting() {
  updateSettings({ pro: false });
}
