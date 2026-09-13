# Kintampo — Native Apple apps (SwiftUI)

Native **iPhone, Mac, and Apple Watch** client for Kintampo African Market.  
This folder lives **next to** your existing Next.js web app — nothing in the repo root was removed or replaced.

## Three clients, one backend

| Client | Folder | Runs on | How users get it |
|--------|--------|---------|------------------|
| **Web store** | `/` (Next.js) | Browser, PWA | Vercel URL |
| **Android wrapper** | `/mobile` (Capacitor) | Android WebView | Play Store / sideload |
| **Native Apple** | `/apple` (SwiftUI) | iOS, macOS, watchOS | App Store / Xcode |

There is **no single codebase that “switches” at runtime**. Each client is a separate app that talks to the **same Supabase database** and **same Next.js API** (`/api/*` on your production domain).

### What “auto-detect” means in practice

- **Safari / Chrome** → web app (unchanged).
- **Installed native app** → SwiftUI UI, local cart, same products/orders.
- **Apple Watch** → companion app (cart summary + order tracking); full shop on phone/Mac.
- Optional later: **Universal Links** so `kintampoafricanmarket.com/products/…` opens the native app when installed.

Your original Next.js code, Vercel deploy, and `/mobile` Capacitor project are **untouched**.

---

## Quick start (Xcode)

1. **Copy config** (once):

   ```bash
   cd apple
   cp Config.example.xcconfig Config.xcconfig
   ```

   Fill `Config.xcconfig` from the repo root `.env.local`:

   - `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SITE_URL` → `NEXT_PUBLIC_SITE_URL`
   - `STRIPE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. **Open in Xcode**

   ```bash
   open KintampoMarket.xcodeproj
   ```

3. Select a target and run:
   - **KintampoMarket** — iPhone / iPad simulator
   - **KintampoMarketMac** — Mac
   - **KintampoMarketWatch** — Watch (requires iOS companion built first)

4. Set your **Development Team** in Signing & Capabilities for each target.

Or run `./setup.sh` (creates `Config.xcconfig`; uses XcodeGen if installed).

---

## App features (v1)

- **Home** — categories, new arrivals from Supabase
- **Shop** — search, category filters, in-stock toggle
- **Product detail** — add to cart
- **Cart** — local persistence (same key idea as web `lqam-cart`); checkout opens live web checkout (Stripe) until native PaymentSheet is wired
- **Track order** — `GET /api/orders/track`
- **Account** — Supabase email/password sign-in
- **Watch** — cart count, subtotal, order lookup

---

## Project layout

```
apple/
  KintampoMarket.xcodeproj
  Config.example.xcconfig   ← template (committed)
  Config.xcconfig           ← your keys (gitignored)
  KintampoMarket/
    KintampoMarketApp.swift
    Models/ Services/ ViewModels/ Views/ Theme/ Platform/
  KintampoMarketWatch/
    Info.plist
```

---

## Checkout note

Web checkout POST routes enforce same-origin CSRF. The native app currently sends users to **Safari / in-app browser** for payment. Next step: add `/api/mobile/*` routes with Bearer auth, or Stripe iOS PaymentSheet + `POST /api/checkout/payment-intent` with proper headers.

---

## Regenerating the Xcode project

If you use [XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
cd apple && xcodegen generate
```

`project.yml` is the source of truth when using XcodeGen; `KintampoMarket.xcodeproj` is checked in so you can open it without extra tools.
