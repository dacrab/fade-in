import type { Id } from "../../convex/_generated/dataModel"

export type UserRole = "customer" | "owner" | "barber" | "admin"

export interface AuthUser {
	id: string
	name: string
	email: string
	role: UserRole
	avatarUrl?: string
}

export interface DayHours {
	open: string
	close: string
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

export interface SocialLinks {
	instagram?: string
	facebook?: string
	website?: string
}

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

export interface Barber {
	_id: Id<"barbers">
	_creationTime: number
	userId?: Id<"users">
	barbershopId: Id<"barbershops">
	name: string
	bio?: string
	specializations: string[]
	avatarUrl?: string
	workingHours?: WorkingHours
	isActive: boolean
}

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

export interface Review {
	_id: Id<"reviews">
	_creationTime: number
	customerId: Id<"users">
	barbershopId: Id<"barbershops">
	appointmentId: Id<"appointments">
	rating: number
	comment: string
	ownerReply?: string
	createdAt: number
}

export interface User {
	_id: Id<"users">
	_creationTime: number
	name: string
	email: string
	phone?: string
	role: UserRole
	avatarUrl?: string
	favoriteShopIds: Id<"barbershops">[]
}

export const STATUS_BADGE: Record<AppointmentStatus, string> = {
	pending: "badge-gold",
	confirmed: "badge-green",
	completed: "badge-gray",
	cancelled: "badge-red",
}

export const WEEK_DAYS: WeekDay[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]
