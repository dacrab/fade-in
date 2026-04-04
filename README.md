<div align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="FadeIn logo" />
  <h1>FadeIn</h1>
  <p><strong>The modern barbershop booking platform</strong></p>
  <p>
    Discover · Book · Review — in seconds.
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Convex-1.32-EE342A?style=flat-square" alt="Convex" />
    <img src="https://img.shields.io/badge/TanStack_Start-latest-FF4154?style=flat-square" alt="TanStack Start" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind v4" />
    <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Bun-1.3-F9F1E1?style=flat-square&logo=bun" alt="Bun" />
    <img src="https://img.shields.io/badge/i18n-en_|_el-brightgreen?style=flat-square" alt="i18n" />
  </p>
</div>

---

## ✨ What is FadeIn?

**FadeIn** is a two-sided marketplace where customers discover and book barbershops, and shop owners manage everything from a single dashboard. Think of it as a premium, modern alternative to ebarber.gr — built on real-time infrastructure.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR) |
| **Backend / DB** | [Convex](https://convex.dev) v1.32 — real-time database + serverless functions |
| **Auth** | [@convex-dev/auth](https://github.com/get-convex/convex-auth) — email/password + anonymous |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + custom dark gold design system |
| **Components** | [@base-ui/react](https://base-ui.com) — headless, accessible primitives |
| **Map** | [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) |
| **i18n** | [i18next](https://www.i18next.com) + react-i18next — English 🇬🇧 & Greek 🇬🇷 |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Dates** | [date-fns](https://date-fns.org) |
| **Linter** | [Biome](https://biomejs.dev) (strict) |
| **Package Manager** | [Bun](https://bun.sh) |

---

## 🗂 Project Structure

```
fade-in/
├── convex/                  # Backend (Convex serverless functions)
│   ├── schema.ts            # Database schema (6 tables)
│   ├── auth.ts              # Convex Auth config
│   ├── users.ts             # User queries & mutations
│   ├── barbershops.ts       # Shop CRUD + search + map
│   ├── barbers.ts           # Barber management
│   ├── services.ts          # Service CRUD
│   ├── appointments.ts      # Booking + real-time slot availability
│   └── reviews.ts           # Review system + owner replies
│
├── src/
│   ├── components/
│   │   ├── ui/              # Base UI wrappers (Dialog, Select, Slider, Menu…)
│   │   ├── BookingModal.tsx  # Multi-step booking flow
│   │   ├── MapView.tsx       # Leaflet map with dark theme
│   │   ├── Header.tsx        # Nav + user menu + language toggle
│   │   └── Footer.tsx
│   ├── hooks/
│   │   └── useAuth.ts        # Convex Auth hook
│   ├── i18n/
│   │   ├── index.ts          # i18next setup
│   │   └── locales/
│   │       ├── en.ts         # English translations
│   │       └── el.ts         # Greek translations
│   ├── lib/
│   │   ├── cn.ts             # clsx + tailwind-merge
│   │   └── format.ts         # Price, date, time formatters
│   ├── routes/
│   │   ├── index.tsx         # Home — hero, search, featured shops
│   │   ├── barbershops/      # Listing + map + filters / Shop profile
│   │   ├── dashboard/        # Customer dashboard (appointments, favorites, profile)
│   │   ├── business/         # Owner dashboard (appointments, services, barbers…)
│   │   ├── admin/            # Admin panel (verify shops, manage users)
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── for-business.tsx  # B2B landing page
│   └── types/
│       └── index.ts          # Shared TypeScript interfaces + constants
│
├── public/
│   └── favicon.svg
├── biome.json               # Strict linter + formatter config
├── tsconfig.json            # Full strict TypeScript config
└── vite.config.ts
```

---

## 🗄 Database Schema

```
users          — id, name, email, phone, role, avatarUrl, favoriteShopIds[]
barbershops    — id, name, slug, ownerId, description, phone, address,
                 city, lat, lng, images[], rating, reviewCount,
                 isVerified, isActive, workingHours{}, socialLinks{}
barbers        — id, userId, barbershopId, name, bio, specializations[],
                 avatarUrl, workingHours{}, isActive
services       — id, barbershopId, name, description, price (cents),
                 durationMinutes, category, isActive
appointments   — id, customerId, barbershopId, barberId, serviceIds[],
                 date, startTime, endTime, totalPrice,
                 status (pending|confirmed|completed|cancelled), notes
reviews        — id, customerId, barbershopId, appointmentId,
                 rating (1–5), comment, ownerReply
```

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **customer** | Browse, book, review, manage appointments & favorites |
| **owner** | Manage shop(s), barbers, services, appointments, view reviews |
| **barber** | View own schedule |
| **admin** | Verify/suspend shops, manage all users |

---

## 📄 Routes

| Route | Description |
|---|---|
| `/` | Homepage — hero, search, featured shops |
| `/barbershops` | Listing with map toggle + rating filter |
| `/barbershops/$slug` | Shop profile, services, barbers, reviews, booking |
| `/for-business` | B2B landing page with pricing |
| `/login` | Sign in |
| `/register` | Create account (customer or owner) |
| `/dashboard` | Customer appointments + stats |
| `/dashboard/favorites` | Saved shops |
| `/dashboard/profile` | Edit profile |
| `/business` | Owner overview + sidebar |
| `/business/appointments` | Confirm/cancel/complete bookings |
| `/business/services` | Full CRUD services |
| `/business/barbers` | Full CRUD barbers |
| `/business/reviews` | View reviews + reply |
| `/business/profile` | Create/edit shop |
| `/admin` | Platform stats |
| `/admin/shops` | Verify/suspend shops |
| `/admin/users` | User list by role |

---

## ⚡ Key Features

- **Real-time slot availability** — Convex `useQuery` means zero double-bookings
- **Multi-step booking modal** — Services → Barber → Date/Time → Confirm → Done
- **Interactive Leaflet map** — Dark-themed, gold markers, popup Book Now links
- **Role-based access** — Route guards per user role
- **i18n** — Full English + Greek translation coverage
- **Strict TypeScript** — `noImplicitAny`, `strictNullChecks`, all flags on
- **Base UI components** — Fully accessible, headless, styled with Tailwind v4

---

## 🛠 Development Setup

### Prerequisites
- [Bun](https://bun.sh) ≥ 1.3
- [Convex account](https://dashboard.convex.dev)

### Install

```bash
bun install
```

### Environment

```bash
cp .env.example .env.local
```

Then fill in your values in `.env.local` (see `.env.example` for details).

### Run

```bash
# Terminal 1 — Convex backend (real-time sync)
bunx convex dev

# Terminal 2 — Frontend
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
bun run preview
```

---

## 🌍 Internationalization

FadeIn supports **English** 🇬🇧 and **Greek** 🇬🇷 out of the box.

- Translation files: `src/i18n/locales/en.ts` and `src/i18n/locales/el.ts`
- Language toggle in the header — persisted to `localStorage`
- Auto-detects browser language on first visit

To add a new language:

```ts
// src/i18n/locales/fr.ts
const fr = { common: { loading: "Chargement..." }, ... }
export default fr

// src/i18n/index.ts — add to resources and LANGUAGES
```

---

## 🎨 Design System

- **Theme**: Dark (`#0A0A0A` background) with gold/amber accents (`#F59E0B`)
- **Typography**: System font stack, antialiased
- **Components**: CSS custom properties + Tailwind v4 utilities
- **Animations**: `fade-up`, `fade-in`, skeleton shimmer
- **Map**: Leaflet with inverted dark tiles + gold custom markers

---

## 📦 Scripts

```bash
bun dev          # Start dev server (port 3000)
bun run build    # Production build
bun run preview  # Preview production build
bun run check    # Biome lint + format check
bun run lint     # Biome lint only
bun run format   # Biome format only
```

---

## 📝 License

MIT — built with ❤️ in Thessaloniki.
