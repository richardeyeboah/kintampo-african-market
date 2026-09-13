# Kintampo African Market

E-commerce platform for **Kintampo African Market** — groceries from Ghana and the Caribbean, with online ordering, Stripe payments, and store operations tooling.

## Stack

- Next.js (App Router)
- Supabase
- Stripe
- Vercel

## Native Apple apps (SwiftUI)

The **web store stays in this folder** (unchanged). Native iPhone, Mac, and Apple Watch apps live in [`apple/`](apple/README.md) — same Supabase + API backend, separate SwiftUI codebase. See [`apple/README.md`](apple/README.md) for Xcode setup.

## Local setup

```bash
cd merge
npm install
copy .env.example .env.local
# fill .env.local with your keys
npm run dev
```

Open http://localhost:3000 (or the port shown in the terminal).

## Notes

Private credentials belong in Vercel and `.env.local` only — never commit secrets.

## Deployment

Connected to Vercel via GitHub — pushes to `main` deploy to production automatically.
