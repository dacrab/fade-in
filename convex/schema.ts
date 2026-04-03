import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	...authTables,
	users: defineTable({
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		role: v.union(v.literal("customer"), v.literal("owner"), v.literal("barber"), v.literal("admin")),
		avatarUrl: v.optional(v.string()),
		favoriteShopIds: v.array(v.id("barbershops")),
	})
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
		workingHours: v.optional(
			v.object({
				monday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				tuesday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				wednesday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				thursday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				friday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				saturday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				sunday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
			}),
		),
		socialLinks: v.optional(
			v.object({
				instagram: v.optional(v.string()),
				facebook: v.optional(v.string()),
				website: v.optional(v.string()),
			}),
		),
	})
		.index("by_slug", ["slug"])
		.index("by_owner", ["ownerId"])
		.index("by_city", ["city"])
		.index("by_active", ["isActive"]),

	barbers: defineTable({
		userId: v.optional(v.id("users")),
		barbershopId: v.id("barbershops"),
		name: v.string(),
		bio: v.optional(v.string()),
		specializations: v.array(v.string()),
		avatarUrl: v.optional(v.string()),
		workingHours: v.optional(
			v.object({
				monday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				tuesday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				wednesday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				thursday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				friday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				saturday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
				sunday: v.optional(v.object({ open: v.string(), close: v.string(), closed: v.boolean() })),
			}),
		),
		isActive: v.boolean(),
	})
		.index("by_shop", ["barbershopId"])
		.index("by_user", ["userId"]),

	services: defineTable({
		barbershopId: v.id("barbershops"),
		name: v.string(),
		description: v.optional(v.string()),
		// Monetary values are stored in cents (integer) to avoid floating-point errors.
		price: v.number(),
		durationMinutes: v.number(),
		category: v.string(),
		isActive: v.boolean(),
	})
		.index("by_shop", ["barbershopId"])
		.index("by_category", ["category"]),

	appointments: defineTable({
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(), // YYYY-MM-DD
		startTime: v.string(), // HH:MM
		endTime: v.string(), // HH:MM
		// Monetary total is stored in cents.
		totalPrice: v.number(),
		status: v.union(
			v.literal("pending"),
			v.literal("confirmed"),
			v.literal("completed"),
			v.literal("cancelled"),
		),
		notes: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_customer", ["customerId"])
		.index("by_shop", ["barbershopId"])
		.index("by_barber", ["barberId"])
		.index("by_date", ["date"])
		.index("by_status", ["status"]),

	reviews: defineTable({
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		appointmentId: v.id("appointments"),
		rating: v.number(), // 1-5
		comment: v.string(),
		ownerReply: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_shop", ["barbershopId"])
		.index("by_customer", ["customerId"])
		.index("by_appointment", ["appointmentId"]),
})
