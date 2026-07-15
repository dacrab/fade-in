import { createFileRoute, Link, useSearch } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle,
	Clock,
	Scissors,
	User,
	XCircle,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Skeleton } from "#/components/ui/Skeleton"
import { formatDate, formatPrice } from "#/lib/format"
import { asId, STATUS_BADGE } from "#/types"
import { api } from "../../../convex/_generated/api"

const searchSchema = z.object({
	token: z.string().optional(),
})

export const Route = createFileRoute("/booking/$id/manage")({
	validateSearch: searchSchema,
	component: ManagePage,
})

function ManagePage() {
	const { t } = useTranslation()
	const { id } = Route.useParams()
	const { token } = useSearch({ from: "/booking/$id/manage" })

	const appointment = useQuery(api.appointments.getById, { id: asId<"appointments">(id) })
	const shop = useQuery(
		api.barbershops.getById,
		appointment ? { id: appointment.barbershopId } : "skip",
	)
	const barber = useQuery(api.barbers.getById, appointment ? { id: appointment.barberId } : "skip")

	const isTokenValid = (token?.length ?? 0) > 0
	const appt = appointment ?? null

	return (
		<main className="page-main">
			<div className="page-wrap max-w-2xl py-8">
				<Link
					to="/"
					className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) hover:text-(--gold) transition-colors mb-6"
				>
					<ArrowLeft size={15} />
					{t("errors.backHome")}
				</Link>

				{!isTokenValid && (
					<div className="rounded-xl border border-(--gold)/20 bg-(--gold)/5 p-4 mb-6 flex items-center gap-3">
						<AlertCircle size={20} className="text-(--gold) shrink-0" />
						<p className="text-sm text-(--text-muted)">{t("manage.noToken")}</p>
					</div>
				)}

				{appointment === undefined ? (
					<ManageSkeleton />
				) : !appt ? (
					<div className="text-center py-16">
						<XCircle size={48} className="mx-auto mb-4 text-(--text-subtle)" />
						<h1 className="text-xl font-bold text-(--text) mb-2">{t("manage.notFound")}</h1>
						<p className="text-sm text-(--text-muted) mb-6">{t("manage.notFoundMessage")}</p>
						<Link to="/" className="btn btn-primary">
							{t("errors.backHome")}
						</Link>
					</div>
				) : (
					<div className="rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
						<div className="p-6 pb-4 border-b border-(--border)">
							<div className="flex items-center gap-4 mb-3">
								<div className="w-12 h-12 rounded-xl bg-(--gold)/10 flex items-center justify-center">
									<Scissors size={22} className="text-(--gold)" />
								</div>
								<div>
									<h1 className="text-lg font-bold text-(--text)">{shop?.name ?? t("manage.shop")}</h1>
									<p className="text-xs text-(--text-muted) mt-0.5">
										{shop?.address}, {shop?.city}
									</p>
								</div>
							</div>
							<span
								className={`badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[appt.status]}`}
							>
								{appt.status === "confirmed" || appt.status === "completed" ? (
									<CheckCircle size={11} />
								) : appt.status === "cancelled" ? (
									<XCircle size={11} />
								) : (
									<Clock size={11} />
								)}
								{t(`status.${appt.status}`)}
							</span>
						</div>

						<div className="p-6 space-y-5">
							<div className="grid grid-cols-2 gap-5">
								<div>
									<p className="text-[11px] text-(--text-subtle) mb-1">{t("booking.summaryFields.date")}</p>
									<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
										<Calendar size={14} className="text-(--text-subtle)" />
										{formatDate(appt.date)}
									</p>
								</div>
								<div>
									<p className="text-[11px] text-(--text-subtle) mb-1">{t("booking.summaryFields.time")}</p>
									<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
										<Clock size={14} className="text-(--text-subtle)" />
										{appt.startTime} – {appt.endTime}
									</p>
								</div>
								<div>
									<p className="text-[11px] text-(--text-subtle) mb-1">
										{t("booking.summaryFields.barber")}
									</p>
									<p className="text-sm font-medium text-(--text) flex items-center gap-1.5">
										<User size={14} className="text-(--text-subtle)" />
										{barber?.name ?? "—"}
									</p>
								</div>
								<div>
									<p className="text-[11px] text-(--text-subtle) mb-1">{t("booking.summaryFields.total")}</p>
									<p className="text-sm font-bold text-(--gold)">{formatPrice(appt.totalPrice)}</p>
								</div>
							</div>

							{shop?.phone && (
								<div>
									<p className="text-[11px] text-(--text-subtle) mb-1">{t("form.phoneLabel")}</p>
									<a href={`tel:${shop.phone}`} className="text-sm text-(--gold) hover:underline">
										{shop.phone}
									</a>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</main>
	)
}

function ManageSkeleton() {
	return (
		<div className="rounded-2xl border border-(--border) bg-(--bg-card) overflow-hidden">
			<div className="p-6 border-b border-(--border)">
				<div className="flex items-center gap-4 mb-3">
					<Skeleton className="w-12 h-12 rounded-xl" />
					<div>
						<Skeleton className="h-5 w-40 mb-1" />
						<Skeleton className="h-3 w-56" />
					</div>
				</div>
			</div>
			<div className="p-6 space-y-5">
				<div className="grid grid-cols-2 gap-5">
					<Skeleton className="h-14 rounded-lg" />
					<Skeleton className="h-14 rounded-lg" />
					<Skeleton className="h-14 rounded-lg" />
					<Skeleton className="h-14 rounded-lg" />
				</div>
				<Skeleton className="h-16 rounded-lg" />
			</div>
		</div>
	)
}
