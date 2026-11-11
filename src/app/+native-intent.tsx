// Text shared from another app opens the app at "<scheme>://expo-sharing".
// That is not a screen, so send it to the memo list; the shared text is picked up there.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('expo-sharing')) return '/';
  } catch {
    // Fall through to the path as given.
  }
  return path;
}
