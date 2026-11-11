import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { withoutLocking } from './lock';
import { type Memo, memosToText } from './memos';

const TEXT_EXPORT_NAME = 'kkuk-memos.txt';

/** Writes text to a temporary file and opens the share sheet for it. */
export async function shareTextFile(name: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(content);
  await withoutLocking(() => Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name }));
}

/** Writes every memo to one text file and opens the share sheet for it. */
export async function exportMemos(memos: Memo[]) {
  await shareTextFile(TEXT_EXPORT_NAME, memosToText(memos), 'text/plain');
}

/** The exported file is readable text, so it is removed the next time the app starts. */
export function clearExportedFile() {
  try {
    const file = new File(Paths.cache, TEXT_EXPORT_NAME);
    if (file.exists) file.delete();
  } catch {
    // Nothing to clean up.
  }
}

/** Lets the user pick a file and returns its text, or null if they cancel. */
export async function pickTextFile(): Promise<string | null> {
  const result = await withoutLocking(() =>
    DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true }),
  );
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  try {
    return await file.text();
  } finally {
    try {
      file.delete();
    } catch {
      // The cached copy is cleared by the system later.
    }
  }
}
