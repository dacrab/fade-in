<div align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="FadeIn logo" />
  <h1>FadeIn</h1>
  <p><strong>Discover · Book · Review</strong> — the modern barbershop platform.</p>
</div>

---

## What is FadeIn?

FadeIn connects customers with barbershops through a seamless booking experience. Find shops near you, book in a few clicks, and leave reviews — all from one place.

Built with [TanStack Start](https://tanstack.com/start) (React 19 SSR), [Convex](https://convex.dev), Clerk auth, Polar payments, and Resend email.

## For Customers

- Discover barbershops via list or interactive map (Leaflet, loaded lazily only when the map view opens)
- Search by name (Convex search index) with debounced input and cursor-based pagination
- Multi-step booking: services → barber → date → time slot
- Manage bookings, reschedule, save favorites, review completed appointments

## For Business Owners

- Sign up as an owner; the first shop creation (or signup intent) grants the `owner` role
- Shop profile editor including weekly opening hours (per-day closed toggle + open/close times)
- Services & barbers CRUD, appointment management, owner replies to reviews

## How it works

- **Booking slots** follow each shop's saved opening hours (closed days return no slots), and requested times are re-validated server-side.
- **Payments**: booking a paid service reserves the slot until checkout. Confirmed payments turn the appointment active; abandoned checkouts release the slot automatically.
- **Validation is server-side**: service prices must be positive and durations within 1–480 minutes; opening hours require `close > open` on open days.
- **Dates are local-time `YYYY-MM-DD` strings**, parsed without UTC shifting.

## Getting Started

You'll need [Bun](https://bun.sh) 1.4.2+ and a [Convex account](https://dashboard.convex.dev).

```bash
bun install
# Set up secrets (via Doppler — or copy .env.example to .env)
doppler setup
bunx convex dev   # start backend (pushes schema + search/cron config)
bun dev           # start app
```

Open [localhost:5173](http://localhost:5173).

## Scripts

```bash
bun dev              # development server
bun run build        # production build
bun run lint         # biome check (lint + format)
bun run lint:fix     # biome check --write
bun run typecheck    # tsc --noEmit
bun run knip         # find unused files, deps, and exports
bun run test         # vitest suite (slots, formatting, i18n parity)
bun run validate     # lint + typecheck + knip + test + build
```

## Deployment

Frontend deploys on [Vercel](https://vercel.com); the backend deploys to a Convex production deployment. Secrets live in Doppler (`fade-in` project, `prd_app` config).

**Convex production environment.** Set these on the production deployment (`bunx convex env set NAME 'value' --prod`, or the dashboard):

| Variable | Purpose |
| --- | --- |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer; auth fails to load without it |
| `PUBLIC_SITE_URL` | Public app URL, used for payment redirects |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | Polar checkout + webhook signature |
| `RESEND_API_KEY`, `RESEND_FROM` | Transactional email (optional — skipped when unset) |

**Deploy the backend:**

```bash
doppler run --config prd_app -- bunx convex deploy
```

**Vercel** builds with `doppler run -- bun run build`; set `VITE_CONVEX_URL` to the production deployment. Register the Polar webhook at `<convex-site-url>/polar-webhook` with the same `POLAR_WEBHOOK_SECRET`.

## License

MIT — built with ❤️ in Thessaloniki.
