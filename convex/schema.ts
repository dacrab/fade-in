import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { socialLinksValidator, workingHoursValidator } from "./validators"

export default defineSchema({
	users: defineTable({
		clerkId: v.string(),
		name: v.optional(v.string()),
		email: v.string(),
		phone: v.optional(v.string()),
		role: v.optional(
			v.union(v.literal("customer"), v.literal("owner"), v.literal("barber"), v.literal("admin")),
		),
		avatarUrl: v.optional(v.string()),
		favoriteShopIds: v.optional(v.array(v.id("barbershops"))),
		emailVerified: v.optional(v.boolean()),
	})
		.index("by_clerkId", ["clerkId"])
		.index("by_email", ["email"])
		.index("by_role", ["role"]),

	barbershops: defineTable({
		name: v.string(),
		slug: v.string(),
		ownerId: v.id("users"),
		description: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.string(),
		city: v.string(),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		images: v.array(v.string()),
		rating: v.number(),
		reviewCount: v.number(),
		isVerified: v.boolean(),
		isActive: v.boolean(),
		workingHours: workingHoursValidator,
		socialLinks: socialLinksValidator,
	})
		.index("by_slug", ["slug"])
		.index("by_owner", ["ownerId"])
		.index("by_city", ["city"])
		.index("by_city_active", ["city", "isActive"])
		.index("by_active", ["isActive"])
		.index("by_active_rating", ["isActive", "rating"])
		.index("by_city_active_rating", ["city", "isActive", "rating"])
		.index("by_active_verified_rating", ["isActive", "isVerified", "rating"])
		.searchIndex("search_name", {
			searchField: "name",
			filterFields: ["city", "isActive"],
		}),

	barbers: defineTable({
		barbershopId: v.id("barbershops"),
		name: v.string(),
		bio: v.optional(v.string()),
		specializations: v.array(v.string()),
		avatarUrl: v.optional(v.string()),
		userId: v.optional(v.id("users")),
		workingHours: workingHoursValidator,
		isActive: v.boolean(),
	})
		.index("by_shop", ["barbershopId"])
		.index("by_shop_active", ["barbershopId", "isActive"])
		.index("by_user", ["userId"])
		.index("by_user_active", ["userId", "isActive"]),

	services: defineTable({
		barbershopId: v.id("barbershops"),
		name: v.string(),
		description: v.optional(v.string()),
		price: v.number(),
		durationMinutes: v.number(),
		category: v.string(),
		isActive: v.boolean(),
	})
		.index("by_shop", ["barbershopId"])
		.index("by_shop_active", ["barbershopId", "isActive"]),

	appointments: defineTable({
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		totalPrice: v.number(),
		status: v.union(
			v.literal("pending"),
			v.literal("confirmed"),
			v.literal("completed"),
			v.literal("cancelled"),
		),
		notes: v.optional(v.string()),
		polarCheckoutId: v.optional(v.string()),
		paymentStatus: v.optional(v.union(v.literal("unpaid"), v.literal("paid"))),
		createdAt: v.number(),
	})
		.index("by_customer", ["customerId"])
		.index("by_shop", ["barbershopId"])
		.index("by_shop_date", ["barbershopId", "date"])
		.index("by_shop_status_date", ["barbershopId", "status", "date"])
		.index("by_barber", ["barberId"])
		.index("by_barber_date", ["barberId", "date"])
		.index("by_status", ["status"])
		.index("by_status_createdAt", ["status", "createdAt"])
		.index("by_polar_checkout", ["polarCheckoutId"]),

	reviews: defineTable({
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		appointmentId: v.id("appointments"),
		rating: v.number(),
		comment: v.string(),
		ownerReply: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_shop", ["barbershopId"])
		.index("by_appointment", ["appointmentId"])
		.index("by_customer", ["customerId"]),

	/**
	 * Denormalized all-time counters for the owner dashboard, maintained in the
	 * same mutations that change appointments. `getShopStats` used to collect
	 * every appointment a shop had ever taken on every subscription update.
	 * `backfilledAt` marks a row whose counters cover all pre-existing
	 * appointments; rows without it fall back to the legacy computation.
	 */
	shopStats: defineTable({
		barbershopId: v.id("barbershops"),
		totalRevenue: v.number(),
		monthKey: v.string(),
		monthRevenue: v.number(),
		completedCount: v.number(),
		totalCount: v.number(),
		pendingCount: v.number(),
		cancelledCount: v.number(),
		backfilledAt: v.optional(v.number()),
	}).index("by_shop", ["barbershopId"]),
})
