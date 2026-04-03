import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { MessageSquare, Send } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { StarRating } from "#/components/ui/StarRating"
import { showToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { formatRelative } from "#/lib/format"
import type { Barbershop, Review } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/reviews")({ component: BusinessReviews })

function BusinessReviews() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const shopsRaw = useQuery(
		api.barbershops.listByOwner,
		user ? { ownerId: user.id as Id<"users"> } : "skip",
	)
	const shop = shopsRaw?.[0] as Barbershop | undefined
	const reviewsRaw = useQuery(api.reviews.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const reviews = reviewsRaw as Review[] | undefined
	const addReply = useMutation(api.reviews.addOwnerReply)
	const [replyId, setReplyId] = useState<string | null>(null)
	const [replyText, setReplyText] = useState("")

	const handleReply = async (id: Id<"reviews">) => {
		if (!replyText.trim()) return
		try {
			await addReply({ id, ownerReply: replyText })
			showToast(t("errors.replyAdded"), "success")
			setReplyId(null)
			setReplyText("")
		} catch {
			showToast(t("errors.replyFailed"), "error")
		}
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl">
				<div className="page-header">
					<Link to="/business" className="breadcrumb-back">
						← {t("nav.business")}
					</Link>
					<span className="breadcrumb-sep">/</span>
					<h1>{t("business.reviews.title")}</h1>
				</div>

				{shop && (
					<div className="card p-4 mb-6 flex items-center gap-4">
						<div className="text-4xl font-bold text-[var(--gold)]">{shop.rating.toFixed(1)}</div>
						<div>
							<StarRating rating={shop.rating} size={18} />
							<p className="text-sm text-[var(--text-muted)] mt-0.5">
								{t("map.reviewsCount", { count: shop.reviewCount })}
							</p>
						</div>
					</div>
				)}

				{reviews === undefined ? (
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
							<Skeleton key={i} className="h-28 w-full rounded-xl" />
						))}
					</div>
				) : reviews.length === 0 ? (
					<div className="empty-state">
						<MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
						<p className="text-sm">{t("business.reviews.noReviews")}</p>
					</div>
				) : (
					<div className="space-y-4">
						{reviews.map((r: Review) => (
							<div key={r._id} className="card p-5">
								<div className="flex items-center justify-between mb-2">
									<StarRating rating={r.rating} size={16} />
									<span className="text-xs text-[var(--text-muted)]">{formatRelative(r.createdAt)}</span>
								</div>
								<p className="text-sm text-[var(--text-muted)] mb-3">{r.comment}</p>
								{r.ownerReply ? (
									<div className="pl-3 border-l-2 border-[var(--gold)]/30 text-xs text-[var(--text-muted)]">
										<span className="text-[var(--gold)] font-semibold">
											{t("business.reviews.yourReply")}
										</span>
										{r.ownerReply}
									</div>
								) : replyId === r._id ? (
									<div className="flex gap-2 mt-2">
										<input
											className="input text-sm"
											placeholder={t("business.reviews.replyPlaceholder")}
											value={replyText}
											onChange={(e) => setReplyText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") void handleReply(r._id)
											}}
										/>
										<button
											type="button"
											onClick={() => void handleReply(r._id)}
											className="btn btn-primary text-sm px-3 gap-1"
										>
											<Send size={13} />
											{t("business.reviews.replyButton")}
										</button>
										<button type="button" onClick={() => setReplyId(null)} className="btn btn-ghost text-sm">
											{t("common.cancel")}
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => {
											setReplyId(r._id)
											setReplyText("")
										}}
										className="text-xs text-[var(--gold)] hover:underline btn-bare"
									>
										{t("business.reviews.replyAction")}
									</button>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
