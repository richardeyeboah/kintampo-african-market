# Kintampo — Native Apple apps (SwiftUI)

Native **iPhone** (primary), Mac, and Watch clients for Kintampo African Market.  
Lives next to the Next.js web store — web code is not replaced.

## Honest status

| Item | Status |
|------|--------|
| Browse / search / cart | Ready |
| Auth, wishlist, addresses, orders | Ready |
| Native Stripe PaymentSheet checkout | Ready (iOS) against `/api/mobile/checkout/*` |
| Apple Pay | Optional — set `APPLE_PAY_MERCHANT_ID` after Apple Developer + Stripe setup |
| App Store packaging | Needs your Apple **Development Team**, real app icon art, TestFlight QA |
| Live customer charges | Still on **Stripe test keys** until you switch to `pk_live_…` |

This is a **usable customer beta**, not a finished App Store submission.

## Quick start

```bash
cd apple
cp Config.example.xcconfig Config.xcconfig   # once
# Fill keys from repo-root .env.local
open KintampoMarket.xcodeproj
```

1. Select target **KintampoMarket**
2. Signing → your **Team**
3. Run on iPhone Simulator or device

## Config keys

From `.env.local`:

- `SUPABASE_URL` ← `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` ← `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SITE_URL` ← `https://kintampoafricanmarket.com`
- `STRIPE_PUBLISHABLE_KEY` ← `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `APPLE_PAY_MERCHANT_ID` ← leave blank until merchant ID exists

## Checkout

iOS uses **Stripe PaymentSheet** → `POST /api/mobile/checkout/payment-intent` → `GET /api/mobile/checkout/status`.  
Do not open Safari checkout from the app for payment.

After paying: cart clears only when status confirms an order. If confirmation is slow, use **Check payment status** — do not pay twice.

## Regenerating the Xcode project

```bash
cd apple && python3 sync_xcode_project.py
# or: xcodegen generate
```
