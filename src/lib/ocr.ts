import { requireNativeModule } from 'expo';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { withoutLocking } from './lock';

export const ocrAvailable = true;

// The app's own small module (modules/kkuk-ocr) around the phone's on-device recognizer.
type OcrModule = { recognizeAsync(uri: string): Promise<string> };

export type OcrResult =
  | { text: string }
  | { error: 'canceled' | 'no-permission' | 'no-text' }
  | { error: 'failed'; detail: string };

/**
 * Takes or picks a photo and reads the text in it. The reading happens on the
 * phone itself; the photo is not sent anywhere and is not kept afterwards.
 */
export async function readTextFromPhoto(source: 'camera' | 'library'): Promise<OcrResult> {
  let stage = 'pick';
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return { error: 'no-permission' };
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const picked = await withoutLocking(() =>
      source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options),
    );
    if (picked.canceled) return { error: 'canceled' };

    const uri = picked.assets[0].uri;
    stage = 'read';
    try {
      const recognizer = requireNativeModule<OcrModule>('KkukOcr');
      const text = (await recognizer.recognizeAsync(uri)).trim();
      return text ? { text } : { error: 'no-text' };
    } finally {
      try {
        new File(uri).delete();
      } catch {
        // The picker's temporary copy is cleared by the system later.
      }
    }
  } catch (error) {
    return { error: 'failed', detail: `${stage}: ${error instanceof Error ? error.message : String(error)}` };
  }
}
