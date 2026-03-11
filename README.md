# Orvexa Studio - 3D E-commerce MVP

FlowerBX tasarım yaklaşımından ilham alan, `Next.js + Express + MongoDB` tabanlı fullstack cicek e-ticaret MVP projesi.

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, Anime.js
- Backend: Node.js, Express, MongoDB + Mongoose, JWT Auth
- Payments: Stripe JS SDK + Stripe Server SDK (Sandbox)
- Shipping: Royal Mail adapter (V1), takip ve label metadata
- Infra: Vercel (FE), VPS (BE), MongoDB Atlas (UK region)

## Monorepo Yapisi

- `apps/web`: Next.js frontend
- `apps/api`: Express API
- `packages/types`: Paylasilan tipler
- `packages/config`: Ortak config package placeholder
- `infra`: Docker compose + Nginx config

## Local Gelistirme

1. Ortam degiskenlerini hazirla:
   - `apps/api/.env.example` -> `apps/api/.env`
   - `apps/web/.env.example` -> `apps/web/.env.local`
2. Bagimliliklari yukle:
   - `npm install`
3. Ayrik calistir:
   - API: `npm run dev:api`
   - Web: `npm run dev:web`

## Build ve Kontrol

- Tum build: `npm run build`
- Lint: `npm run lint`
- API test: `npm run test`
- Smoke test script: `infra/scripts/smoke-test.sh`

## Stripe Sandbox Notlari

- Stripe Dashboard icinde sandbox ortam olustur.
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET` degerlerini sadece test keylerle doldur.
- Webhook endpoint:
  - `POST /api/payments/webhook`
- Test kartlari icin Stripe testing sayfasini kullan.

Dokuman: [Stripe Sandboxes](https://docs.stripe.com/sandboxes)

## Royal Mail Notlari

- Royal Mail API hesabini acip API key/secret al.
- Ilk surumde label olusturma adaptor mantigi ile kurgulandi.
- Keyler yoksa servis simule tracking numarasi dondurur.

Dokuman: [Royal Mail API Portal](https://developer.royalmail.net/api)

## FlowerBX Tasarim Referansi

- Premium tipografi ve sade layout
- Editorial hero + curated cards
- Mega-menu hissi veren ust navigasyon

Referans: [FlowerBX](https://www.flowerbx.com/)

# orvexastudio
