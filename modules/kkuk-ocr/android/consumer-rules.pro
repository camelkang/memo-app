# Release builds shrink and rename code. The text recognizer looks parts of itself
# up by name at run time, so those classes must be kept as they are.
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_** { *; }
-keep class com.google.android.odml.** { *; }
-keep class com.google.firebase.components.** { *; }
-dontwarn com.google.mlkit.**
