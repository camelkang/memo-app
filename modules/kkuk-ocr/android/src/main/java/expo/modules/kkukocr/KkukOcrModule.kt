package expo.modules.kkukocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class OcrFailedException(message: String, cause: Throwable?) :
  CodedException("ERR_OCR_FAILED", message, cause)

/** Reads the text in an image file, entirely on the device. */
class KkukOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KkukOcr")

    AsyncFunction("recognizeAsync") { uri: String, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      try {
        val image = InputImage.fromFilePath(context, Uri.parse(uri))
        val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
        recognizer.process(image)
          .addOnSuccessListener { result ->
            recognizer.close()
            promise.resolve(result.text)
          }
          .addOnFailureListener { error ->
            recognizer.close()
            promise.reject(OcrFailedException(error.message ?: "Text recognition failed", error))
          }
      } catch (error: Exception) {
        promise.reject(OcrFailedException(error.message ?: "Could not open the image", error))
      }
    }
  }
}
