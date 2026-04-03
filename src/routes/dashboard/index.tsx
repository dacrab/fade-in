import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { Calendar, Heart, User, Clock, CheckCircle, XCircle, Scissors } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import { formatPrice, formatDateShort } from "../../lib/format"
import { STATUS_BADGE, type Appointment, type Barbershop } from "../../types"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/")({ component: CustomerDashboard })

function CustomerDashboard() {
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) { void router.navigate({ to: "/login" }); return }
		if (!loading && user && user.role !== "customer" && user.role !== "admin")
			void router.navigate({ to: "/" })
	}, [user, loading, router])

	const appointments = useQuery(
		api.appointments.listByCustomer,
		user ? { customerId: user.id as Id<"users"> } : "skip",
	)

	if (loading || !user) return <DashSkeleton />

	const upcoming =
		appointments?.filter(
			(a: Doc<"appointments">) => a.status === "pending" || a.status === "confirmed",
		) ?? []
	const past =
		appointments?.filter(
			(a: Doc<"appointments">) => a.status === "completed" || a.status === "cancelled",
		) ?? []

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-4xl">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-2xl font-bold text-[var(--text)]">My Dashboard</h1>
						<p className="text-[var(--text-muted)] text-sm">Welcome back, {user.name}!</p>
					</div>
					<div className="flex gap-2">
						<Link to="/dashboard/favorites" className="btn btn-secondary gap-2 text-sm">
							<Heart size={15} /> Favorites
						</Link>
						<Link to="/dashboard/profile" className="btn btn-secondary gap-2 text-sm">
							<User size={15} /> Profile
						</Link>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
					{(
						[
							{ label: "Total bookings", value: appointments?.length ?? "—", icon: Calendar },
							{ label: "Upcoming", value: upcoming.length, icon: Clock },
							{
								label: "Completed",
								value: appointments?.filter((a: Doc<"appointments">) => a.status === "completed").length ?? "—",
								icon: CheckCircle,
							},
							{
								label: "Cancelled",
								value: appointments?.filter((a: Doc<"appointments">) => a.status === "cancelled").length ?? "—",
								icon: XCircle,
							},
						] as const
					).map(({ label, value, icon: Icon }) => (
						<div key={label} className="card p-4">
							<Icon size={18} className="text-[var(--gold)] mb-2" />
							<div className="text-2xl font-bold text-[var(--text)]">{value}</div>
							<div className="text-xs text-[var(--text-muted)]">{label}</div>
						</div>
					))}
				</div>

				{/* Upcoming */}
				<div className="card p-5 mb-5">
					<h2 className="font-bold text-[var(--text)] mb-4">Upcoming appointments</h2>
					{appointments === undefined ? (
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					) : upcoming.length === 0 ? (
						<div className="text-center py-8 text-[var(--text-muted)]">
							<Calendar size={32} className="mx-auto mb-2 opacity-30" />
							<p className="text-sm">No upcoming appointments</p>
							<Link to="/barbershops" className="btn btn-primary mt-3 inline-flex text-sm">
								Book now
							</Link>
						</div>
					) : (
						<div className="space-y-3">
							{upcoming.map((appt: Doc<"appointments">) => (
								<AppointmentRow key={appt._id} appt={appt as Appointment} />
							))}
						</div>
					)}
				</div>

				{/* Past */}
				{past.length > 0 && (
					<div className="card p-5">
						<h2 className="font-bold text-[var(--text)] mb-4">Past appointments</h2>
						<div className="space-y-3">
							{past.slice(0, 5).map((appt: Doc<"appointments">) => (
								<AppointmentRow key={appt._id} appt={appt as Appointment} />
							))}
						</div>
					</div>
				)}
			</div>
		</main>
	)
}

function AppointmentRow({ appt }: { appt: Appointment }) {
	const shop = useQuery(api.barbershops.getById, { id: appt.barbershopId }) as
		| Barbershop
		| null
		| undefined
	return (
		<div
			className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
			style={{ background: "var(--bg-input)" }}
		>
			<div
				className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
				style={{ background: "rgba(245,158,11,0.1)" }}
			>
				<Scissors size={18} className="text-[var(--gold)]" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-[var(--text)] text-sm truncate">
					{shop?.name ?? "..."}
				</div>
				<div className="text-xs text-[var(--text-muted)]">
					{formatDateShort(appt.date)} at {appt.startTime}
				</div>
			</div>
			<div className="text-sm font-bold text-[var(--gold)]">{formatPrice(appt.totalPrice)}</div>
			<span className={`badge ${STATUS_BADGE[appt.status]}`}>{appt.status}</span>
		</div>
	)
}

function DashSkeleton() {
	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-4xl space-y-6">
				<Skeleton className="h-10 w-48" />
				<div className="grid grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-64 rounded-2xl" />
			</div>
		</main>
	)
}
