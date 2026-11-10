import * as DocumentPicker from 'expo-document-picker';

import { type Memo, memosToText } from './memos';

/** Downloads text as a file. */
export async function shareTextFile(name: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Downloads every memo as one text file. */
export async function exportMemos(memos: Memo[]) {
  await shareTextFile('kkuk-memos.txt', memosToText(memos), 'text/plain');
}

export function clearExportedFile() {}

/** Lets the user pick a file and returns its text, or null if they cancel. */
export async function pickTextFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
  if (result.canceled) return null;
  return (await result.assets[0].file?.text()) ?? null;
}
