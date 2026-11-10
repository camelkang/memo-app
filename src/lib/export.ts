import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { type Memo, memosToText } from './memos';

function exportFile() {
  return new File(Paths.cache, 'kkuk-memos.txt');
}

/** Writes every memo to one text file and opens the share sheet for it. */
export async function exportMemos(memos: Memo[]) {
  const file = exportFile();
  file.create({ overwrite: true });
  await file.write(memosToText(memos));
  await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: '메모 내보내기' });
}

/** The exported file is readable text, so it is removed the next time the app starts. */
export function clearExportedFile() {
  try {
    const file = exportFile();
    if (file.exists) file.delete();
  } catch {
    // Nothing to clean up.
  }
}
