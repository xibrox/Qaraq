#!/bin/bash

# Release APK. Signed with the release keystore when ANDROID_KEYSTORE_BASE64 (or ANDROID_KEYSTORE,
# a path) and ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD are set. Without
# them it keeps Gradle's debug signature, which can't update an install signed with the release key.

set -e

cd "$(dirname "$0")/.."

ROOT="$(pwd)"
APPLICATION_NAME=Qaraq
BUILD="$ROOT/build"
ARCHITECTURES="${ARCHITECTURES:-arm64-v8a,armeabi-v7a}"

mkdir -p "$BUILD"
rm -f "$BUILD/$APPLICATION_NAME.apk"

echo "--- Generating the native project ---"
bunx expo prebuild -p android --clean --no-install

echo "--- Building $APPLICATION_NAME for Android ($ARCHITECTURES) ---"
(cd android && ./gradlew app:assembleRelease -PreactNativeArchitectures="$ARCHITECTURES" --no-daemon)

APK="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK" ]; then
   echo "Error: Build failed, APK not found at $APK"
   exit 1
fi

if [ -n "$ANDROID_KEYSTORE_BASE64" ]; then
   ANDROID_KEYSTORE="$BUILD/release.keystore"
   echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > "$ANDROID_KEYSTORE"
fi

if [ -n "$ANDROID_KEYSTORE" ]; then
   echo "--- Signing with the release keystore ---"
   APKSIGNER="$(ls -d "$ANDROID_HOME"/build-tools/*/apksigner | sort -V | tail -1)"
   # The APK is already zip-aligned by Gradle; apksigner replaces the debug signature.
   "$APKSIGNER" sign \
      --ks "$ANDROID_KEYSTORE" \
      --ks-pass env:ANDROID_KEYSTORE_PASSWORD \
      --ks-key-alias "$ANDROID_KEY_ALIAS" \
      --key-pass env:ANDROID_KEY_PASSWORD \
      --v4-signing-enabled false \
      --out "$BUILD/$APPLICATION_NAME.apk" \
      "$APK"
   "$APKSIGNER" verify "$BUILD/$APPLICATION_NAME.apk"
   if [ -n "$ANDROID_KEYSTORE_BASE64" ]; then rm -f "$ANDROID_KEYSTORE"; fi
else
   echo "--- No release keystore set, keeping the debug signature ---"
   cp "$APK" "$BUILD/$APPLICATION_NAME.apk"
fi

echo "--- Success: build/$APPLICATION_NAME.apk created ---"
