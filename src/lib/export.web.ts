import { type Memo, memosToText } from './memos';

/** Downloads every memo as one text file. */
export async function exportMemos(memos: Memo[]) {
  const url = URL.createObjectURL(new Blob([memosToText(memos)], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kkuk-memos.txt';
  link.click();
  URL.revokeObjectURL(url);
}

export function clearExportedFile() {}
