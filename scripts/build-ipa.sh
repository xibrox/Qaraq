#!/bin/bash

# Unsigned Release IPA for sideloading (AltStore, SideStore, Sideloadly re-sign it on install).
# Same packaging as Shirox's buildipa.sh, with Expo prebuild generating ios/ first.

set -e

cd "$(dirname "$0")/.."

ROOT="$(pwd)"
APPLICATION_NAME=Qaraq
BUILD="$ROOT/build"
export LANG=en_US.UTF-8

mkdir -p "$BUILD"
# A fresh ipa every time: zip adds to an existing archive rather than replacing it.
rm -rf "$BUILD/$APPLICATION_NAME.ipa" "$BUILD/Payload"

echo "--- Generating the native project ---"
bunx expo prebuild -p ios --clean --no-install
(cd ios && pod install)

echo "--- Building $APPLICATION_NAME for iOS ---"
xcodebuild -workspace "ios/$APPLICATION_NAME.xcworkspace" \
   -scheme "$APPLICATION_NAME" \
   -configuration Release \
   -derivedDataPath "$BUILD/DerivedData" \
   -destination 'generic/platform=iOS' \
   build \
   CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGN_ENTITLEMENTS="" CODE_SIGNING_ALLOWED=NO

APP="$BUILD/DerivedData/Build/Products/Release-iphoneos/$APPLICATION_NAME.app"
if [ ! -d "$APP" ]; then
   echo "Error: Build failed, .app not found at $APP"
   exit 1
fi

echo "--- Packaging IPA ---"
mkdir "$BUILD/Payload"
cp -R "$APP" "$BUILD/Payload/"
rm -rf "$BUILD/Payload/$APPLICATION_NAME.app/_CodeSignature" "$BUILD/Payload/$APPLICATION_NAME.app/embedded.mobileprovision"
# AltStore refuses the install unless CFBundleVersion matches apps.json's buildVersion (the CI run number).
if [ -n "$BUILD_NUMBER" ]; then
   /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$BUILD/Payload/$APPLICATION_NAME.app/Info.plist"
fi
(cd "$BUILD" && zip -qr "$APPLICATION_NAME.ipa" Payload)
rm -rf "$BUILD/Payload"

echo "--- Success: build/$APPLICATION_NAME.ipa created ---"
