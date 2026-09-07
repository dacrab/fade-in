import type { Doc, Id, TableNames } from "../../convex/_generated/dataModel"

/** Convex document IDs: base32-encoded, URL-safe, 22 (legacy) or 32 (current) chars. */
const ID_RE = /^[a-z0-9]{22,32}$/

/**
 * Validate an untrusted string (e.g. a route param) as a Convex document ID.
 * Returns null instead of mistyping garbage as `Id<T>`; the server-side
 * `v.id()` validator remains the authoritative check.
 */
export function parseId<T extends TableNames>(id: string): Id<T> | null {
	// Single justified cast: the regex above has verified the ID shape.
	return ID_RE.test(id) ? (id as Id<T>) : null
}

export type UserRole = "customer" | "owner" | "barber" | "admin"

export function parseUserRole(role: string | null | undefined): UserRole {
	if (role === "customer" || role === "owner" || role === "barber" || role === "admin") return role
	return "customer"
}

export function isOwnerOrAdmin(user: { role?: UserRole } | null | undefined): boolean {
	return user?.role === "owner" || user?.role === "admin"
}

export const PAGE_SIZE = 50

export type WeekDay =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday"

export const WEEK_DAYS: WeekDay[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]

/** Editable form shape for one week of opening hours. */
export type WorkingHoursForm = Record<WeekDay, { open: string; close: string; closed: boolean }>

export type Barbershop = Doc<"barbershops">
export type Barber = Doc<"barbers">
export type Service = Doc<"services">
export type Appointment = Doc<"appointments">
export type Review = Doc<"reviews">

export type AppointmentStatus = Appointment["status"]

export function isAppointmentStatus(s: string): s is AppointmentStatus {
	return s === "pending" || s === "confirmed" || s === "completed" || s === "cancelled"
}

export const STATUS_BADGE: Record<AppointmentStatus, string> = {
	pending: "badge-gold",
	confirmed: "badge-green",
	completed: "badge-gray",
	cancelled: "badge-red",
}

export const STATUS_DOT: Record<AppointmentStatus, string> = {
	pending: "bg-amber-400",
	confirmed: "bg-green-500",
	completed: "bg-green-500",
	cancelled: "bg-red-400",
}
