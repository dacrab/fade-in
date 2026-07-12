import type { Id } from "../../convex/_generated/dataModel"

export type UserRole = "customer" | "owner" | "barber" | "admin"

/** Whether a user can manage a barbershop (owner or platform admin). */
export function isOwnerOrAdmin(user: { role?: UserRole } | null | undefined): boolean {
	return user?.role === "owner" || user?.role === "admin"
}

/** Default page size for paginated backend queries. */
export const PAGE_SIZE = 50

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

export const WEEK_DAYS: WeekDay[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]

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
	price: number
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
	date: string
	startTime: string
	endTime: string
	totalPrice: number
	status: AppointmentStatus
	notes?: string
	polarCheckoutId?: string
	paymentStatus?: "unpaid" | "paid"
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
