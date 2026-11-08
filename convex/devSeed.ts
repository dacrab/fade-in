import { v } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import { internalMutation } from "./_generated/server"
import { computeShopStats, currentMonthKey } from "./lib/shopStats"

/**
 * Development-only demo data. These mutations are internal (no browser auth
 * required) and exist so a fresh Convex dev deployment can be explored with a
 * realistic owner/barber/customer experience.
 *
 *   bunx convex run devSeed:seedDemo
 *   bunx convex run devSeed:claimDemoAccount            # after signing in once
 *   bunx convex run devSeed:claimDemoAccount '{"email":"you@example.com"}'
 *
 * Never call these against the production deployment.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const DEMO_CLERK_PREFIX = "demo_"
const DEMO_SLUGS = ["the-cutting-room", "northside-barbers", "harbor-fade-co"] as const

const WEEK_HOURS = {
	monday: { open: "09:00", close: "20:00", closed: false },
	tuesday: { open: "09:00", close: "20:00", closed: false },
	wednesday: { open: "09:00", close: "20:00", closed: false },
	thursday: { open: "09:00", close: "20:00", closed: false },
	friday: { open: "09:00", close: "20:00", closed: false },
	saturday: { open: "09:00", close: "20:00", closed: false },
	sunday: { open: "09:00", close: "20:00", closed: false },
}

const SERVICES = [
	{
		name: "Signature Haircut",
		description: "Consultation, precision cut and styling with a hot towel finish.",
		price: 25,
		durationMinutes: 30,
		category: "hair",
	},
	{
		name: "Skin Fade",
		description: "Close skin fade blended into your preferred length on top.",
		price: 28,
		durationMinutes: 40,
		category: "hair",
	},
	{
		name: "Beard Trim & Shape",
		description: "Line-up, shape and condition, finished with beard oil.",
		price: 15,
		durationMinutes: 20,
		category: "beard",
	},
	{
		name: "Haircut & Beard",
		description: "The full reset: haircut plus a shaped and conditioned beard.",
		price: 38,
		durationMinutes: 50,
		category: "combo",
	},
	{
		name: "Kids Cut",
		description: "Relaxed cut for under-12s, with a chair that goes up and down.",
		price: 18,
		durationMinutes: 25,
		category: "kids",
	},
]

interface ShopSeed {
	name: string
	slug: (typeof DEMO_SLUGS)[number]
	description: string
	phone: string
	address: string
	city: string
	lat: number
	lng: number
	images: string[]
	barbers: { name: string; bio: string; specializations: string[] }[]
	reviews: { rating: number; comment: string; ownerReply?: string }[]
}

const SHOPS: ShopSeed[] = [
	{
		name: "The Cutting Room",
		slug: "the-cutting-room",
		description:
			"A modern barbershop in Kolonaki focused on precision fades, sharp scissor work and a proper espresso while you wait.",
		phone: "+30 210 555 0101",
		address: "Skoufa 42, Kolonaki",
		city: "Athens",
		lat: 37.9795,
		lng: 23.743,
		images: ["/images/hero-barbershop.jpg", "/images/shop-barbershop.jpg"],
		barbers: [
			{
				name: "Yiannis Kourtis",
				bio: "Owner and master barber with 14 years behind the chair. Known for skin fades and classic scissor cuts.",
				specializations: ["Skin fades", "Scissor cuts", "Classic styling"],
			},
			{
				name: "Marios Delis",
				bio: "Beard specialist who treats every trim like a small ritual — hot towels, straight razor and oil.",
				specializations: ["Beard shaping", "Hot towel shaves", "Line-ups"],
			},
		],
		reviews: [
			{
				rating: 5,
				comment:
					"Best fade I've had in Athens. Clean shop, great music and Yiannis actually listens to what you ask for.",
				ownerReply: "Thanks so much — see you next time!",
			},
			{
				rating: 4,
				comment: "Friendly staff and easy booking. The hot towel finish was a nice touch.",
			},
			{
				rating: 5,
				comment: "Walked in for a beard trim and left looking like a new person. Worth every euro.",
			},
		],
	},
	{
		name: "Northside Barbers",
		slug: "northside-barbers",
		description:
			"A relaxed neighbourhood shop on Tsimiski with a focus on honest cuts, good conversation and no rush.",
		phone: "+30 2310 555 0202",
		address: "Tsimiski 88",
		city: "Thessaloniki",
		lat: 40.6333,
		lng: 22.9439,
		images: ["/images/shop-barbershop.jpg", "/images/barber-detail.jpg"],
		barbers: [
			{
				name: "Petros Laskaris",
				bio: "Northside's founder. Ten years of city-centre barbering with a soft spot for textured crops.",
				specializations: ["Textured crops", "Fades", "Kids cuts"],
			},
			{
				name: "Thanasis Vlachos",
				bio: "Scissor-first barber who loves classic side parts and a well-groomed beard.",
				specializations: ["Classic cuts", "Side parts", "Beard trims"],
			},
		],
		reviews: [
			{
				rating: 5,
				comment: "Petros is a proper craftsman. Booked again before I even left the chair.",
				ownerReply: "Cheers — always good to have you in.",
			},
			{
				rating: 5,
				comment: "Took my son for his first real haircut and they were brilliant with him.",
			},
			{
				rating: 4,
				comment: "Great cut and fair price. Street parking nearby is the only downside.",
			},
		],
	},
	{
		name: "Harbor Fade Co.",
		slug: "harbor-fade-co",
		description:
			"Patras' harbour-side barbershop: fast, precise fades by day and a calm, detail-obsessed chair by evening.",
		phone: "+30 2610 555 0303",
		address: "Agios Nikolaos 15",
		city: "Patras",
		lat: 38.2466,
		lng: 21.7346,
		images: ["/images/barber-detail.jpg", "/images/hero-barbershop.jpg"],
		barbers: [
			{
				name: "Christos Manolis",
				bio: "Fade specialist and co-owner. Fast hands, clean lines and a loyal Saturday queue.",
				specializations: ["Skin fades", "Buzz cuts", "Hair tattoos"],
			},
			{
				name: "Andreas Fotis",
				bio: "Joined from Athens and brought a love of sharp beards and old-school pompadours.",
				specializations: ["Pompadours", "Beard sculpting", "Classic shaves"],
			},
		],
		reviews: [
			{
				rating: 4,
				comment: "Solid fade and a really nice space. Busy on Saturdays, so book ahead.",
			},
			{
				rating: 5,
				comment: "Andreas fixed a cut another shop had butchered. Absolute lifesaver.",
				ownerReply: "Glad we could sort it — thank you for trusting us.",
			},
			{
				rating: 5,
				comment: "Cleanest line-up I've had in Patras. Already booked my next visit.",
			},
		],
	},
]

const OWNERS = [
	{ clerkId: "demo_owner_1", name: "Alexandros Petrou", email: "alexandros@demo.fade-in.local" },
	{ clerkId: "demo_owner_2", name: "Sofia Marinou", email: "sofia@demo.fade-in.local" },
	{ clerkId: "demo_owner_3", name: "Nikos Georgiou", email: "nikos@demo.fade-in.local" },
]

const CUSTOMERS = [
	{ clerkId: "demo_customer_1", name: "Giorgos Papadopoulos", email: "giorgos@demo.fade-in.local" },
	{ clerkId: "demo_customer_2", name: "Maria Nikolaou", email: "maria@demo.fade-in.local" },
	{ clerkId: "demo_customer_3", name: "Dimitris Vasileiou", email: "dimitris@demo.fade-in.local" },
	{ clerkId: "demo_customer_4", name: "Eleni Karagianni", email: "eleni@demo.fade-in.local" },
	{ clerkId: "demo_customer_5", name: "Kostas Antoniou", email: "kostas@demo.fade-in.local" },
]

type DemoStatus = "pending" | "confirmed" | "completed" | "cancelled"

const APPOINTMENT_PLAN: { offset: number; status: DemoStatus; time: string }[] = [
	{ offset: -30, status: "completed", time: "10:00" },
	{ offset: -21, status: "completed", time: "11:00" },
	{ offset: -14, status: "completed", time: "12:00" },
	{ offset: -7, status: "completed", time: "13:00" },
	{ offset: 1, status: "confirmed", time: "15:00" },
	{ offset: 3, status: "pending", time: "16:00" },
	{ offset: -2, status: "cancelled", time: "17:00" },
]

function isoDate(offsetDays: number): string {
	const date = new Date()
	date.setHours(12, 0, 0, 0)
	date.setDate(date.getDate() + offsetDays)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate(),
	).padStart(2, "0")}`
}

function addMinutes(time: string, minutes: number): string {
	const [hours = 0, mins = 0] = time.split(":").map(Number)
	const total = hours * 60 + mins + minutes
	return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function dateToMs(date: string): number {
	return new Date(`${date}T18:00:00`).getTime()
}

/** Refuse to run against a deployment whose public site is not local. */
function assertDevDeployment() {
	const siteUrl = process.env.PUBLIC_SITE_URL ?? ""
	if (siteUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(siteUrl)) {
		throw new Error(
			"devSeed is development-only: PUBLIC_SITE_URL does not point at localhost on this deployment.",
		)
	}
}

export const seedDemo = internalMutation({
	args: {},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one-off seeder, easier to read as a single script
	handler: async (ctx) => {
		assertDevDeployment()
		// Remove a previous seed by slug, not by owner: `claimDemoAccount`
		// reassigns shop ownership to a real user, and re-seeding should still
		// replace the demo shops cleanly.
		const removedShopIds: Id<"barbershops">[] = []
		for (const slug of DEMO_SLUGS) {
			const shop = await ctx.db
				.query("barbershops")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first()
			if (!shop) continue
			removedShopIds.push(shop._id)

			const reviews = await ctx.db
				.query("reviews")
				.withIndex("by_shop", (q) => q.eq("barbershopId", shop._id))
				.collect()
			for (const review of reviews) await ctx.db.delete(review._id)

			const appointments = await ctx.db
				.query("appointments")
				.withIndex("by_shop", (q) => q.eq("barbershopId", shop._id))
				.collect()
			for (const appointment of appointments) await ctx.db.delete(appointment._id)

			const stats = await ctx.db
				.query("shopStats")
				.withIndex("by_shop", (q) => q.eq("barbershopId", shop._id))
				.collect()
			for (const row of stats) await ctx.db.delete(row._id)

			const barbers = await ctx.db
				.query("barbers")
				.withIndex("by_shop", (q) => q.eq("barbershopId", shop._id))
				.collect()
			for (const barber of barbers) await ctx.db.delete(barber._id)

			const services = await ctx.db
				.query("services")
				.withIndex("by_shop", (q) => q.eq("barbershopId", shop._id))
				.collect()
			for (const service of services) await ctx.db.delete(service._id)

			await ctx.db.delete(shop._id)
		}

		const users = await ctx.db.query("users").collect()
		const removedShopIdSet = new Set<string>(removedShopIds)
		for (const user of users) {
			if (user.clerkId.startsWith(DEMO_CLERK_PREFIX)) {
				await ctx.db.delete(user._id)
				continue
			}
			// Don't leave a real user's favourites pointing at deleted shops.
			const favourites = user.favoriteShopIds
			if (favourites?.some((id) => removedShopIdSet.has(id))) {
				await ctx.db.patch(user._id, {
					favoriteShopIds: favourites.filter((id) => !removedShopIdSet.has(id)),
				})
			}
		}

		const ownerIds = []
		for (const owner of OWNERS) {
			ownerIds.push(
				await ctx.db.insert("users", {
					clerkId: owner.clerkId,
					name: owner.name,
					email: owner.email,
					role: "owner",
				}),
			)
		}

		const customerIds = []
		for (const customer of CUSTOMERS) {
			customerIds.push(
				await ctx.db.insert("users", {
					clerkId: customer.clerkId,
					name: customer.name,
					email: customer.email,
					role: "customer",
				}),
			)
		}

		let appointmentCount = 0
		let reviewCount = 0

		for (const [shopIndex, seed] of SHOPS.entries()) {
			const ownerId = ownerIds[shopIndex]
			if (!ownerId) continue

			const ratings = seed.reviews.map((review) => review.rating)
			const rating = ratings.length
				? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
				: 0

			const shopId = await ctx.db.insert("barbershops", {
				name: seed.name,
				slug: seed.slug,
				ownerId,
				description: seed.description,
				phone: seed.phone,
				address: seed.address,
				city: seed.city,
				lat: seed.lat,
				lng: seed.lng,
				images: seed.images,
				rating,
				reviewCount: ratings.length,
				isVerified: true,
				isActive: true,
				workingHours: WEEK_HOURS,
				socialLinks: {
					instagram: `https://instagram.com/${seed.slug}`,
					website: `https://${seed.slug}.example`,
				},
			})

			const serviceIds: { id: Id<"services">; price: number; durationMinutes: number }[] = []
			for (const service of SERVICES) {
				const id = await ctx.db.insert("services", {
					barbershopId: shopId,
					name: service.name,
					description: service.description,
					price: service.price,
					durationMinutes: service.durationMinutes,
					category: service.category,
					isActive: true,
				})
				serviceIds.push({
					id,
					price: service.price,
					durationMinutes: service.durationMinutes,
				})
			}

			const barberIds = []
			for (const barber of seed.barbers) {
				barberIds.push(
					await ctx.db.insert("barbers", {
						barbershopId: shopId,
						name: barber.name,
						bio: barber.bio,
						specializations: barber.specializations,
						workingHours: WEEK_HOURS,
						isActive: true,
					}),
				)
			}

			for (const [index, plan] of APPOINTMENT_PLAN.entries()) {
				const service = serviceIds[index % serviceIds.length]
				const barberId = barberIds[index % barberIds.length]
				const customerId = customerIds[index % customerIds.length]
				if (!(service && barberId && customerId)) continue

				const date = isoDate(plan.offset)
				const apptId = await ctx.db.insert("appointments", {
					customerId,
					barbershopId: shopId,
					barberId,
					serviceIds: [service.id],
					date,
					startTime: plan.time,
					endTime: addMinutes(plan.time, service.durationMinutes),
					totalPrice: service.price,
					status: plan.status,
					notes:
						index === 0
							? "First visit — please leave a little extra time for a consultation."
							: undefined,
					paymentStatus: plan.status === "pending" || plan.status === "cancelled" ? "unpaid" : "paid",
					createdAt: Math.min(Date.now(), dateToMs(date)) - 3 * DAY_MS,
				})
				appointmentCount += 1

				// Reviews on the three oldest completed visits.
				const reviewSeed = seed.reviews[index]
				if (index < 3 && plan.status === "completed" && reviewSeed) {
					await ctx.db.insert("reviews", {
						customerId,
						barbershopId: shopId,
						appointmentId: apptId,
						rating: reviewSeed.rating,
						comment: reviewSeed.comment,
						ownerReply: reviewSeed.ownerReply,
						createdAt: dateToMs(date) + DAY_MS,
					})
					reviewCount += 1
				}
			}

			const counters = await computeShopStats(ctx, shopId)
			await ctx.db.insert("shopStats", {
				barbershopId: shopId,
				...counters,
				monthKey: currentMonthKey(),
				backfilledAt: Date.now(),
			})
		}

		return {
			shops: SHOPS.length,
			users: OWNERS.length + CUSTOMERS.length,
			appointments: appointmentCount,
			reviews: reviewCount,
		}
	},
})

export const claimDemoAccount = internalMutation({
	args: {
		email: v.optional(v.string()),
		clerkId: v.optional(v.string()),
		name: v.optional(v.string()),
	},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one-off claim helper, easier to read inline
	handler: async (ctx, args) => {
		assertDevDeployment()
		const users = await ctx.db.query("users").collect()

		const email = args.email?.trim().toLowerCase()
		let user: Doc<"users"> | undefined = email
			? users.find((candidate) => candidate.email.toLowerCase() === email)
			: users
					.filter((candidate) => !candidate.clerkId.startsWith(DEMO_CLERK_PREFIX))
					.sort((a, b) => b._creationTime - a._creationTime)[0]

		// Allow pre-provisioning a signed-in account (useful with a freshly
		// created Clerk keyless instance) so ownership is ready before the first
		// browser login. `ensureCurrentUser` then reuses this row by `clerkId`.
		if (!user && args.clerkId) {
			const id = await ctx.db.insert("users", {
				clerkId: args.clerkId,
				email: args.email?.trim() ?? "",
				name: args.name ?? args.email ?? "Demo User",
				role: "customer",
			})
			user = (await ctx.db.get(id)) ?? undefined
		}

		if (!user) {
			throw new Error(
				"No real account found. Sign in at http://localhost:3000 once, then run this again.",
			)
		}
		if (user.clerkId.startsWith(DEMO_CLERK_PREFIX)) {
			throw new Error("That account is part of the demo data. Use your own signed-in account.")
		}

		const shops = []
		for (const slug of DEMO_SLUGS) {
			const shop = await ctx.db
				.query("barbershops")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first()
			if (shop) shops.push(shop)
		}
		if (shops.length === 0) {
			throw new Error("Demo shops not found. Run devSeed:seedDemo first.")
		}

		for (const shop of shops) {
			await ctx.db.patch(shop._id, { ownerId: user._id })
		}

		// Give the real user a barber profile in the flagship shop and clear any
		// previous demo link so `barbers.getByUserId` resolves to exactly one row.
		const primaryShop = shops[0]
		if (!primaryShop) throw new Error("Demo shops not found.")
		const barber = await ctx.db
			.query("barbers")
			.withIndex("by_shop", (q) => q.eq("barbershopId", primaryShop._id))
			.first()
		if (barber) {
			const previousLinks = await ctx.db
				.query("barbers")
				.withIndex("by_user", (q) => q.eq("userId", user._id))
				.collect()
			for (const previous of previousLinks) {
				if (previous._id !== barber._id) {
					await ctx.db.patch(previous._id, { userId: undefined })
				}
			}
			await ctx.db.patch(barber._id, { userId: user._id })
		}

		// Two latest completed visits (one reviewed, one not) plus the next
		// confirmed visit, so the customer dashboard has history and an upcoming
		// appointment to look at.
		const completed = await ctx.db
			.query("appointments")
			.withIndex("by_shop_status_date", (q) =>
				q.eq("barbershopId", primaryShop._id).eq("status", "completed"),
			)
			.order("desc")
			.take(2)
		const confirmed = await ctx.db
			.query("appointments")
			.withIndex("by_shop_status_date", (q) =>
				q.eq("barbershopId", primaryShop._id).eq("status", "confirmed"),
			)
			.order("desc")
			.take(1)

		const claimed = [...completed, ...confirmed]
		for (const appointment of claimed) {
			await ctx.db.patch(appointment._id, { customerId: user._id })
			const review = await ctx.db
				.query("reviews")
				.withIndex("by_appointment", (q) => q.eq("appointmentId", appointment._id))
				.first()
			if (review) await ctx.db.patch(review._id, { customerId: user._id })
		}

		await ctx.db.patch(user._id, {
			role: "admin",
			favoriteShopIds: shops.map((shop) => shop._id),
		})

		return {
			userId: user._id,
			email: user.email,
			role: "admin",
			shops: shops.map((shop) => shop.name),
			barberId: barber?._id ?? null,
			appointments: claimed.length,
		}
	},
})
