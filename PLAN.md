```
Project: FadeIn
Description: A modern barbershop booking platform — think a better ebarber.gr.
A two-sided marketplace where customers discover & book barbershops,
and shop owners manage everything from a dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT STACK (already initialized)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Framework:    TanStack Start (React 19, file-based routing)
- Backend/DB:   Convex v1.32 (real-time DB + serverless functions)
- Styling:      Tailwind CSS v4
- Language:     TypeScript
- Linter:       Biome
- Bundler:      Vite v7
- Query:        @convex-dev/react-query + TanStack Query
- Icons:        Lucide React

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIRST STEPS — CLEANUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Remove all demo files before starting:
- src/components/demo-*
- src/components/ThemeToggle.tsx (replace with our own)
- src/data/demo-*
- src/hooks/demo-*
- src/lib/demo-*
- src/routes/about.tsx (replace with our own)
- convex/todos.ts (replace with our schema)
Keep: src/integrations/convex/provider.tsx, router.tsx, __root.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTALL ADDITIONALLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- @auth/core + @convex-dev/auth   (authentication)
- react-leaflet + leaflet          (maps)
- @tanstack/react-query            (already via convex adapter)
- date-fns                         (date formatting)
- clsx + tailwind-merge            (cn utility)
- shadcn/ui compatible components  (radix-ui primitives)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER ROLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. customer   — browse, book, review, manage appointments
2. owner      — manage shop(s), barbers, services, appointments
3. barber     — view own schedule
4. admin      — platform-wide management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTES (TanStack file-based routing under src/routes/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PUBLIC
  /                          → Homepage (hero, search, featured shops)
  /barbershops               → Listing + map + filters
  /barbershops/$slug         → Shop profile + booking CTA
  /for-business              → B2B landing page

AUTH
  /login                     → Email/password + OAuth
  /register                  → Customer or Owner signup

CUSTOMER DASHBOARD
  /dashboard                 → Upcoming & past appointments
  /dashboard/favorites       → Saved shops
  /dashboard/profile         → Edit profile

BUSINESS DASHBOARD
  /business                  → Today's bookings + stats overview
  /business/appointments     → Calendar + appointment management
  /business/services         → CRUD services
  /business/barbers          → Manage barbers + working hours
  /business/profile          → Edit shop info, photos, hours
  /business/reviews          → View & reply to reviews

ADMIN
  /admin                     → Platform stats
  /admin/shops               → Verify/suspend shops
  /admin/users               → Manage users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVEX SCHEMA (convex/schema.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

users          — id, name, email, phone, role, avatarUrl, favoriteShopIds[]
barbershops    — id, name, slug, ownerId, description, phone, address,
                 city, lat, lng, images[], rating, reviewCount,
                 isVerified, isActive, workingHours{}, socialLinks{}
barbers        — id, userId, barbershopId, bio, specializations[],
                 avatarUrl, workingHours{}, isActive
services       — id, barbershopId, name, description, price (cents),
                 durationMinutes, category, isActive
appointments   — id, customerId, barbershopId, barberId, serviceIds[],
                 date, startTime, endTime, totalPrice, status, notes, createdAt
                 status: "pending"|"confirmed"|"completed"|"cancelled"
reviews        — id, customerId, barbershopId, appointmentId,
                 rating (1-5), comment, ownerReply, createdAt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVEX FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

convex/
  auth.ts           — Convex Auth config (email/password + Google OAuth)
  users.ts          — getMe, updateProfile, toggleFavorite
  barbershops.ts    — list (with filters), getBySlug, create, update,
                      search by city/name, getFeatured
  barbers.ts        — listByShop, create, update, getSchedule
  services.ts       — listByShop, create, update, delete
  appointments.ts   — getAvailableSlots (real-time), create, updateStatus,
                      listByCustomer, listByShop, listByBarber
  reviews.ts        — listByShop, create, addOwnerReply
  storage.ts        — generateUploadUrl, getImageUrl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING FLOW (multi-step)
  Step 1 → Select service(s) — price + duration shown
  Step 2 → Select barber — or "any available"
  Step 3 → Pick date — calendar with available days only
  Step 4 → Pick time slot — REAL-TIME via Convex query
  Step 5 → Confirm — summary + notes
  Step 6 → Success — confirmation + add to calendar

SEARCH & DISCOVERY
  - Search by city, area, or name
  - Filters: price range slider, min rating, services, available today
  - Split view: cards (left) + Leaflet map with markers (right)
  - Sort: rating, distance, newest

REAL-TIME (Convex advantage)
  - Slot availability updates live — zero double bookings
  - Business dashboard updates instantly on new booking
  - All via useQuery from @convex-dev/react-query

REVIEWS
  - Only after completed appointment
  - Star rating + comment
  - Owner can reply
  - Displayed on listing cards + shop profile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI / DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Dark theme with gold/amber accents (#F59E0B, #D97706)
- Clean, minimal, premium barbershop feel
- Mobile-first responsive
- Loading skeletons (no spinners)
- Smooth transitions
- Component library: Radix UI primitives styled with Tailwind v4
- Icons: Lucide React

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  Cleanup demo files + set up folder structure
2.  Convex schema + all backend functions
3.  Auth — login/register with Convex Auth (email + Google)
4.  Layout — Navbar, Footer, route guards
5.  Homepage — hero, search bar, featured shops
6.  Barbershop listing page — cards + map + filters
7.  Shop profile page — gallery, services, barbers, reviews
8.  Booking flow — multi-step modal
9.  Customer dashboard — appointments, favorites, profile
10. Business dashboard — shop management, calendar, services
11. Reviews system
12. Admin panel
13. PWA manifest + service worker
14. i18n — Greek + English (optional)
```
