import type { Id } from "../../convex/_generated/dataModel"

// User & Auth

export type UserRole = "customer" | "owner" | "barber" | "admin"

/** Full user document from database */
export interface User {
	_id: Id<"users">
	_creationTime: number
	name: string
	email: string
	phone?: string
	role: UserRole
	avatarUrl?: string
	favoriteShopIds?: Id<"barbershops">[]
}

// Working Hours

export interface DayHours {
	open: string // HH:MM
	close: string // HH:MM
	closed: boolean
}

export type WeekDay =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday"

export type WorkingHours = Partial<Record<WeekDay, DayHours>>

export const WEEK_DAYS: WeekDay[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]

// Social Links

export interface SocialLinks {
	instagram?: string
	facebook?: string
	website?: string
}

// Barbershop

export interface Barbershop {
	_id: Id<"barbershops">
	_creationTime: number
	name: string
	slug: string
	ownerId: Id<"users">
	description?: string
	phone?: string
	address: string
	city: string
	lat?: number
	lng?: number
	images: string[]
	rating: number
	reviewCount: number
	isVerified: boolean
	isActive: boolean
	workingHours?: WorkingHours
	socialLinks?: SocialLinks
}

// Barber

export interface Barber {
	_id: Id<"barbers">
	_creationTime: number
	barbershopId: Id<"barbershops">
	name: string
	bio?: string
	specializations: string[]
	avatarUrl?: string
	workingHours?: WorkingHours
	isActive: boolean
}

// Service

export interface Service {
	_id: Id<"services">
	_creationTime: number
	barbershopId: Id<"barbershops">
	name: string
	description?: string
	price: number // cents
	durationMinutes: number
	category: string
	isActive: boolean
}

// Appointment

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface Appointment {
	_id: Id<"appointments">
	_creationTime: number
	customerId: Id<"users">
	barbershopId: Id<"barbershops">
	barberId: Id<"barbers">
	serviceIds: Id<"services">[]
	date: string // YYYY-MM-DD
	startTime: string // HH:MM
	endTime: string // HH:MM
	totalPrice: number // cents
	status: AppointmentStatus
	notes?: string
	createdAt: number
}

/** Badge CSS classes for appointment statuses */
export const STATUS_BADGE: Record<AppointmentStatus, string> = {
	pending: "badge-gold",
	confirmed: "badge-green",
	completed: "badge-gray",
	cancelled: "badge-red",
}

/** Dot color classes for appointment status indicators */
export const STATUS_DOT: Record<AppointmentStatus, string> = {
	pending: "bg-amber-400",
	confirmed: "bg-green-500",
	completed: "bg-green-500",
	cancelled: "bg-red-400",
}

// Review

export interface Review {
	_id: Id<"reviews">
	_creationTime: number
	customerId: Id<"users">
	barbershopId: Id<"barbershops">
	appointmentId: Id<"appointments">
	rating: number // 1-5
	comment: string
	ownerReply?: string
	createdAt: number
}
