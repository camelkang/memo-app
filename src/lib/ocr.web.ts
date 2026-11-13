// Reading text from photos needs the phone's on-device recognizer; the web preview has none.
export const ocrAvailable = false;

export type OcrResult = { text: string } | { error: 'canceled' | 'no-permission' | 'no-text' | 'failed' };

export async function readTextFromPhoto(_source: 'camera' | 'library'): Promise<OcrResult> {
  return { error: 'failed' };
}
