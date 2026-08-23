import type { Doc, Id, TableNames } from "../../convex/_generated/dataModel"

export function asId<T extends TableNames>(id: string): Id<T> {
	return id as Id<T>
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
