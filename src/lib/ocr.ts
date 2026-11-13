import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { withoutLocking } from './lock';

export const ocrAvailable = true;

export type OcrResult = { text: string } | { error: 'canceled' | 'no-permission' | 'no-text' | 'failed' };

/**
 * Takes or picks a photo and reads the text in it. The reading happens on the
 * phone itself; the photo is not sent anywhere and is not kept afterwards.
 */
export async function readTextFromPhoto(source: 'camera' | 'library'): Promise<OcrResult> {
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
    try {
      // The Korean model also reads Latin letters and digits.
      const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN);
      const text = result.text.trim();
      return text ? { text } : { error: 'no-text' };
    } finally {
      try {
        new File(uri).delete();
      } catch {
        // The picker's temporary copy is cleared by the system later.
      }
    }
  } catch {
    return { error: 'failed' };
  }
}
