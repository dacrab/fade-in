# FadeIn

A friendly way to find and book a barbershop.

**Live demo:** https://fade-in-dacrabs-projects.vercel.app

FadeIn helps customers discover barbershops, compare services, and book an appointment in a few clicks. Shop owners get a simple dashboard for keeping their profile, team, services, and bookings in order.

## Features

- Search for barbershops by name or browse by city
- Switch between a list and a map to explore nearby shops
- Book step by step: service, barber, date, and an open time slot
- Manage, reschedule, and save favorite appointments
- Leave a review after a completed visit
- Owner dashboard for shop details, opening hours, services, barbers, and appointments
- Available in English and Greek

## Run it locally

You'll need [Bun](https://bun.sh), a [Convex](https://convex.dev) account, and [Doppler](https://doppler.com) for secrets.

```bash
bun install
doppler setup
bunx convex dev
bun dev
```

Open [localhost:5173](http://localhost:5173).

If you don't use Doppler, copy `.env.example` to `.env`, fill in the values, and run `bunx vite dev` instead of `bun dev`.

## Good to know

- Booking times follow each shop's opening hours and are checked again on the server.
- Paid bookings hold the time slot during checkout; abandoned checkouts release it automatically.
- You'll need your own Clerk, Convex, and Polar credentials to run the full app.
- Reviews can only be left for completed appointments.

## Built with

TanStack Start, React, Convex, Clerk, Polar, and Tailwind CSS. Hosted on Vercel.

## License

MIT
