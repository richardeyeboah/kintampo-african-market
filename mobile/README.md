# Kintampo native app (Capacitor)

Thin Android/iOS shell that opens the **live website**  
`https://kintampoafricanmarket.com`

This folder does **not** change or redeploy the Next.js site. Vercel still only builds the storefront.

## What you need from the owner

### Required before store submission

1. **Google Play Developer account** (~$25 one-time)  
   https://play.google.com/console/signup  
   → needed for Android (you’re on Windows, so start here)

2. **Apple Developer Program** ($99/year)  
   https://developer.apple.com/programs/  
   → needed for iPhone/iPad. **Requires a Mac** (or a cloud Mac) for Xcode

3. Confirm these names (defaults already set — say if you want different):
   - **App name:** `Kintampo`
   - **Android / iOS ID:** `com.kintampoafricanmarket.app`
   - **Privacy policy URL:** `https://kintampoafricanmarket.com/privacy` (already live)

4. **Store listing assets** (can come later):
   - App icon 512×512 (we can export from `public/icons`)
   - Feature graphic (Play) 1024×500
   - 2–8 screenshots per device size
   - Short description + full description

5. Optional but useful:
   - Business support email for store listing (can be existing store email)
   - Whether the app should load **production** or a **Vercel preview** URL while testing

### Software to install on this PC (Android)

1. [Android Studio](https://developer.android.com/studio) (includes SDK + emulator)
2. Open this project: `mobile/android` via Android Studio, or run `npm run open:android` from `mobile/`

### Software for iPhone (Mac only)

1. Xcode from the Mac App Store  
2. From `mobile/`: `npm run add:ios` then `npm run open:ios`  
   (iOS platform is not generated on Windows)

## Daily commands (from `mobile/`)

```bash
npm install
npm run sync
npm run open:android
```

Point at a preview site while testing (PowerShell):

```powershell
$env:CAPACITOR_SERVER_URL="https://YOUR-preview.vercel.app"
npx cap sync
```

## Privacy / store forms

Use the existing policy: https://kintampoafricanmarket.com/privacy  
Fill Apple App Privacy + Google Data safety to match that page (orders, account, Stripe, Supabase, Vercel — no selling personal data).

## Important (App Store)

Apple sometimes rejects “website in a WebView” apps (Guideline 4.2).  
Play Store is usually more flexible. If Apple rejects, next step is small native extras (push notifications, better offline, deep links) — we can add those when needed.

## Repo layout

```
mobile/
  capacitor.config.ts   ← app id + live site URL
  www/                  ← tiny fallback page (live site loads remotely)
  android/              ← Android Studio project
  ios/                  ← add on a Mac later
```
