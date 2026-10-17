# AlbionKit Mobile

AlbionKit Mobile is a Flutter companion for Albion Online with a live market
dashboard, gold prices, market flips, profit calculators, and faction event
timing.

AlbionKit is a fan-made companion and is not affiliated with, endorsed by, or
sponsored by Sandbox Interactive GmbH. Albion Online and its related
trademarks belong to Sandbox Interactive GmbH.

## Run the app

```sh
flutter pub get
flutter run
```

The dashboard checks AlbionKit API health at `https://api.albionkit.com/v1` and
shows the reported status of the West, East, and Europe servers. The published
API reference currently documents the status endpoint; other mobile features
use the app's existing service integrations.

The app defaults to the light theme. Appearance and alert preferences can be
changed in **Settings** and are stored on the device.

## Alerts

- Bandit reminders schedule a local notification ahead of the next estimated
  server window. The reminder is refreshed when the app starts or the server
  region changes.
- Gold alerts notify once the selected above/below target is reached when gold
  history is refreshed in the app. Continuous background gold-price monitoring
  is not enabled.
- Market flip alerts are checked when market data is fetched in the app.
  Closing or backgrounding the app does not fetch new prices or trigger these
  checks.
- A bandit reminder is scheduled locally for the next window when settings are
  saved or the app starts. Only that next reminder is scheduled; later windows
  are not rescheduled until the app runs again.
- Local notifications are supported on Android and iOS. Web preview saves the
  gold alert rule but cannot deliver notifications.

Bandit windows are estimates, not guarantees; in-game timing can vary.
Android may delay scheduled notifications while battery restrictions or Doze
mode are active. Force-stopping the app also prevents app work until it is
opened again. Opening the app fetches fresh market data, so it can detect a
gold threshold or new flip then and send the notification at that point.
Reliable background gold and market monitoring requires a server-side alert
service that checks prices and sends push notifications; that service is not
currently part of this app.

## Android release signing

Release builds must use a private upload keystore; debug signing is never used
for release variants. Keep the keystore and `android/key.properties` out of
source control. For local builds, create `android/key.properties` with the
following keys, filling in your actual private values and keystore path:

```properties
storeFile=C:/secure/path/albionkit-upload.jks
storePassword=your-store-password
keyAlias=upload
keyPassword=your-key-password
```

Generate the private upload keystore locally with Java's `keytool` before
configuring the properties file. If `keytool` is not on your PATH, use the copy
bundled with Android Studio. In PowerShell, create a folder outside the
repository and generate the key there:

```powershell
$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
$keyFolder = Join-Path $env:USERPROFILE "albionkit-signing"
New-Item -ItemType Directory -Force $keyFolder
& $keytool -genkeypair -v -keystore (Join-Path $keyFolder "albionkit-upload.jks") -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Replace the `storeFile` value in `android/key.properties` with the full path
created above, using forward slashes, for example:
`C:/Users/YourName/albionkit-signing/albionkit-upload.jks`. `keytool` prompts
for a keystore password and certificate details; use a strong password and
keep both passwords private. You can use the same password for the key when
prompted, then enter it for both `storePassword` and `keyPassword`.

Build the Play Store bundle with `flutter build appbundle --release`. The build
stops with an explicit error if the keystore configuration is missing or
invalid. Back up the keystore and passwords securely; losing the signing
credentials can prevent future app updates.

## GitHub Android releases

Pushing a version tag such as `v1.0.1` runs `.github/workflows/android-release.yml`.
The workflow checks that the tag matches the app version in `pubspec.yaml`,
runs analysis and tests, builds a signed APK and Play Store AAB, then attaches
both to a GitHub Release. Before the first tag, add these repository secrets
under **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded contents of your upload keystore.
  In PowerShell, copy the output of:

  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\albionkit-signing\albionkit-upload.jks"))
  ```

- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: `upload` (or the alias you created).
- `ANDROID_KEY_PASSWORD`: password for that key.

Do not commit or paste the keystore or passwords into the repository. For each
release, update `version:` in `pubspec.yaml` with a new semantic version and a
higher build number, commit and push that change, then create and push the
matching tag. For example, for `version: 1.0.1+2`:

```powershell
git tag v1.0.1
git push origin main
git push origin v1.0.1
```
