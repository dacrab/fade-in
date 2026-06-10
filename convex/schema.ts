import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { socialLinksValidator, workingHoursValidator } from "./validators"

export default defineSchema({
	...authTables,
	users: defineTable({
		name: v.optional(v.string()),
		email: v.string(),
		phone: v.optional(v.string()),
		role: v.optional(
			v.union(v.literal("customer"), v.literal("owner"), v.literal("barber"), v.literal("admin")),
		),
		avatarUrl: v.optional(v.string()),
		favoriteShopIds: v.optional(v.array(v.id("barbershops"))),
		emailVerified: v.optional(v.boolean()),
	}).index("by_email", ["email"]),

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
		.index("by_active", ["isActive"]),

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
		.index("by_user", ["userId"]),

	services: defineTable({
		barbershopId: v.id("barbershops"),
		name: v.string(),
		description: v.optional(v.string()),
		price: v.number(), // cents
		durationMinutes: v.number(),
		category: v.string(),
		isActive: v.boolean(),
	}).index("by_shop", ["barbershopId"]),

	appointments: defineTable({
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(), // YYYY-MM-DD
		startTime: v.string(), // HH:MM
		endTime: v.string(), // HH:MM
		totalPrice: v.number(), // cents
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
		.index("by_barber", ["barberId"])
		.index("by_polar_checkout", ["polarCheckoutId"]),

	reviews: defineTable({
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		appointmentId: v.id("appointments"),
		rating: v.number(),
		comment: v.string(),
		ownerReply: v.optional(v.string()),
		createdAt: v.number(),
	}).index("by_shop", ["barbershopId"]),
})
