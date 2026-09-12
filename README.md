# MyOS · Nivetha OS

Private web-first life control center, plus an installable Android companion. ORBIT provides rule-based daily briefings, spoken playback where supported, keyboard commands, and focus sessions. It is not a general AI chatbot or an autonomous agent.

## Use

Open the private deployed URL and sign in with the owner's ChatGPT account. Use the same account on other devices. Pick three daily priorities, log real practice and progress, and use weekly reviews to adjust the plan. All dates use Asia/Kolkata. Calendar, LeetCode and workplace entries remain manual. WHOOP has a direct OAuth integration for sleep, recovery, strain and workouts; complete the [WHOOP setup guide](docs/WHOOP_SETUP.md) to enable live data.

The two-year roadmap spans September 2026–August 2028. It is a planning proposal, not a health, career, or income guarantee. The health section links to [WHO physical activity guidance](https://www.who.int/news-room/fact-sheets/detail/physical-activity); it avoids diet prescriptions and punitive exercise.

## WHOOP

Open WHOOP from the sidebar to connect, sync, inspect 30 days of body data, or disconnect. The homepage brings the latest cycle alongside your daily plans. Sync runs while the app is open; closed-app background syncing is not enabled. No live WHOOP authorization has been completed yet. See [setup instructions](docs/WHOOP_SETUP.md).

## Android

`outputs/Nivetha-OS.apk` is a development-signed APK for Android 8+ (API 26+). It includes a native launch screen and shortcuts into the private hosted OS. It opens the web workspace using Android browser Custom Tabs, falling back to the browser's normal handling. Internet and a browser are required. Account cookies remain in the browser; the app does not request storage, microphone, health, or location permissions. This is an online Android companion, not a standalone native/offline database app. A browser may show its toolbar during sign-in and browsing.

Build with the official Android SDK build tools 36.0.0 and platform android-37.0, plus JDK 17:

```sh
ANDROID_HOME="$HOME/Library/Android/sdk" JAVA_HOME="/path/to/jdk17" python3 android/scripts/build.py
```

The generated development signing key stays in ignored `android/.private`. Retain it to install subsequent updates over this build. For Play Store distribution, use a separately managed production signing process. The prebuilt APK is also served at `/downloads/Nivetha-OS.apk` behind the site's private access policy.

Install the APK on your phone and allow installation from the app opening the downloaded file if Android asks. Open Nivetha OS, tap Open Mission Control, and sign in. Android Custom Tabs are documented by [Android Developers](https://developer.android.com/develop/ui/views/layout/webapps/overview-of-android-custom-tabs).

## Development

The React/Vinext frontend uses the starter's Shadcn primitives, with a pink theme with a contrasting body-signal surface. Sites provides private hosting and dispatch-owned ChatGPT sign-in. Cloudflare D1 is the central source of truth. Browser storage does not hold authoritative records.

- `npm run dev` starts the portable local preview at its printed URL.
- `/signin-with-chatgpt?return_to=/` simulates identity on loopback only.
- `npm run build` builds the Worker and assets.
- `npm run db:generate` creates Drizzle migrations after schema changes.
- Apply pending migrations locally using the generated Worker config:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_common_ser_duncan.sql
```

Do not replay applied migrations. Production migrations are managed by Sites publication.

Every API request checks server-side identity. Records are keyed by owner and entry ID. Prepared SQL and atomic guards enforce four active goals, three priority tasks per day, one active certification, and one running focus session. Version checks reject conflicting edits. The UI refreshes from the central database every 20 seconds and when a tab becomes visible. Failures preserve the open form and show an error. Drafts in open forms are temporary and are not saved until submitted. Cross-device concurrent edits prompt a reload instead of silently overwriting another device's changes.

## Verification

- `npx tsc --noEmit`
- `node tests/api-smoke.mjs` against the local preview only. It creates and cleans its own test records and verifies persistence, atomic caps, conflicts, validation, and focus timing.
- Browser checks: desktop/mobile layout, daily task creation, saved task read-back after reload, command menu, and phone-sized forms.
- Android: APK signature verification, install and cold launch in an API 35 emulator.

The optional `inspect_nivetha_focus` WebMCP tool exposes only the same active goals and priorities visible in the UI, with strict empty-object input validation.
