# FadeIn

Find a barbershop, pick a time, and get on with your day.

Try it at https://fade-in-dacrabs-projects.vercel.app.

FadeIn is a booking site for barbershops. Customers can search by name or city, browse shops on a map, and book a service in a few steps. Shop owners get their own dashboard for the day-to-day admin.

## What you can do

- Search for a shop by name or city, then switch between list and map views
- Book step by step: service, barber, date, and an open time slot
- Reschedule an appointment, save favorites, and review a visit once it's done
- Owners can edit the shop profile, opening hours, services, barbers, and bookings
- Use the site in English or Greek

## Getting started

Bun, a Convex account, and Doppler are needed for local development.

```bash
bun install
doppler setup
bunx convex dev
bun dev
```

Then open [localhost:5173](http://localhost:5173). If you'd rather not use Doppler, copy `.env.example` to `.env` and start Vite with `bunx vite dev`.

## Odds and ends

- Booking times follow each shop's opening hours and are checked again on the server.
- A paid booking holds its slot during checkout; abandoning checkout releases it.
- You'll need your own Clerk, Convex, and Polar credentials for the full app.
- Reviews are only allowed after a completed appointment.

Built with TanStack Start, React, Convex, Clerk, Polar, and Tailwind CSS. MIT licensed.
