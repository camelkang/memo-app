package expo.modules.kkukocr

import android.net.Uri
import com.google.mlkit.common.MlKit
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

/** The error with the first lines of its stack trace, so a failure on a test phone can be located. */
private fun describe(stage: String, error: Throwable): String {
  val frames = error.stackTrace.take(6).joinToString(" < ") { "${it.className.substringAfterLast('.')}.${it.methodName}:${it.lineNumber}" }
  return "$stage: ${error.javaClass.simpleName}: ${error.message} @ $frames"
}

/** Reads the text in an image file, entirely on the device. */
class KkukOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KkukOcr")

    AsyncFunction("recognizeAsync") { uri: String, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      try {
        try {
          // Normally done when the app starts; repeated here in case that step was skipped.
          MlKit.initialize(context.applicationContext)
        } catch (alreadyInitialized: IllegalStateException) {
          // Expected in the normal case.
        }
        val image = InputImage.fromFilePath(context, Uri.parse(uri))
        val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
        recognizer.process(image)
          .addOnSuccessListener { result ->
            recognizer.close()
            promise.resolve(result.text)
          }
          .addOnFailureListener { error ->
            recognizer.close()
            promise.reject(OcrFailedException(describe("process", error), error))
          }
      } catch (error: Throwable) {
        promise.reject(OcrFailedException(describe("setup", error), error))
      }
    }
  }
}
