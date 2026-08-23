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

## Architecture Notes

- **Slot generation respects shop hours**: availability comes from each shop's saved `workingHours` (falling back to global defaults); closed days return no slots. The booking mutation re-validates server-side that requested times fall inside operating hours on the 30-minute grid.
- **Payments**: creating a checkout reserves the slot atomically (pending appointment). The Polar webhook confirms bookings on `checkout.created`/`checkout.updated` with status `succeeded`, and frees the slot on `checkout.expired`. An hourly cron sweeps pending-unpaid appointments older than 24 h.
- **Validation is server-side**: service prices must be positive and durations within 1–480 minutes; opening hours require `close > open` on open days.
- **Dates are local-time `YYYY-MM-DD` strings**, parsed without UTC shifting; month stats derive from local date parts.
- **Reviews**: unique per appointment (indexed check), shop rating/count updated incrementally.
- **Search**: shops use a Convex `searchIndex` (name tokens, city/isActive filters) paginated natively — no offset cursors.
- **Types**: frontend models are aliases of Convex `Doc<"…">` types — no hand-maintained duplicates.

## Getting Started

You'll need [Bun](https://bun.sh) 1.3+ and a [Convex account](https://dashboard.convex.dev).

```bash
bun install
# Set up secrets (via Doppler — or copy .env.example to .env)
doppler setup
bunx convex dev   # start backend (pushes schema + search/cron config)
bun dev           # start app
```

Open [localhost:3000](http://localhost:3000).

## Scripts

```bash
bun dev              # development server
bun run build        # production build
bun run lint         # biome check (lint + format)
bun run lint:fix     # biome check --write
bun run typecheck    # tsc --noEmit
bun run test         # vitest suite (slots, formatting, i18n parity)
bun run validate     # lint + typecheck + test + build
```

## License

MIT — built with ❤️ in Thessaloniki.
