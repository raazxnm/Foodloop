# FoodLoop — from-scratch functional MVP foundation

Fresh Next.js + TypeScript application for FoodLoop's food rescue, trust and recognition platform.

## Included and functional
- Responsive public homepage using the emerald / ivory / terracotta identity.
- Registration and sign-in flows for donor, NGO and volunteer roles.
- Clearly labelled local demo mode when Supabase credentials are absent.
- Demo accounts and donation data persist in the current browser.
- Donors can create surplus-food listings.
- NGOs can browse listed donations and request a donation.
- Basic checks for quantity, preparation time and safe-consumption deadline.
- Supabase Auth client integration and initial PostgreSQL/RLS schema.

## Run locally
Requirements: Node.js 20.19+ or 22.12+, npm.

```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Connect Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart the dev server.

Never expose a service-role key in browser code or `NEXT_PUBLIC_*` variables. Configure email confirmation, redirect URLs and SMTP before production use.

## Important boundaries
This is a first working vertical slice, not a production-ready food-safety, verification or impact system.

Not yet implemented: organization document review, admin verification, verified-only matching, donor acceptance, partial allocations, QR/OTP pickup, distribution evidence, immutable impact ledger, points, scores, certificates, disputes, audits, beneficiary discovery and volunteer delivery.

Demo records are local examples only and must not be represented as real impact. Do not accept previously served, expired or unsafe food. FoodLoop verification must not be described as a food-safety guarantee.


## Milestone 1: Indian identity and emotional homepage

The homepage now uses an India-centred visual language: saffron, vermilion, deep maroon, warm ivory, Devanagari copy, a custom FoodLoop heart-and-leaf mark, a community meal photograph, a clear food-waste contrast, and a Sanskrit passage from the Taittiriya Upanishad. The page avoids invented impact counters and avoids presenting beneficiaries as marketing props.

The Sanskrit line used is **अन्नं न निन्द्यात्। तद्व्रतम्।** (Taittiriya Upanishad, Bhrigu Valli 3.7), commonly translated as “Do not disrespect food. This is the vow.”

The new hero photograph is stored locally in `public/foodloop-community-meal.png`; the logo is `public/foodloop-mark.svg`. No external image host is required for the hero.
