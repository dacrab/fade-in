import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Send } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { formatRelative } from "#/lib/format"
import { PAGE_SIZE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/reviews")({ component: BusinessReviews })

function BusinessReviews() {
	const { user } = useBusinessAuth()
	const { t } = useTranslation()

	const shop = useOwnerShop(user?.id)
	const reviewsResult = useQuery(
		api.reviews.listByShop,
		shop ? { barbershopId: shop._id, paginationOpts: { cursor: null, numItems: PAGE_SIZE } } : "skip",
	)
	const reviews = reviewsResult?.page
	const addReply = useMutation(api.reviews.addOwnerReply)
	const [replyId, setReplyId] = useState<string | null>(null)
	const [replyText, setReplyText] = useState("")

	const handleReply = async (id: Id<"reviews">) => {
		if (!replyText.trim()) return
		await withToast(
			() => addReply({ id, ownerReply: replyText }),
			t("errors.replyAdded"),
			t("errors.replyFailed"),
		)
		setReplyId(null)
		setReplyText("")
	}

	return (
		<div className="px-8 py-8">
			<div className="max-w-3xl mx-auto px-6 py-8">
				<div className="mb-5">
					<h1 className="text-lg font-medium text-(--text) tracking-tight">
						{t("business.reviews.title")}
					</h1>
				</div>

				{shop && (
					<div className="flex items-baseline gap-3 mb-5 pb-6 border-b border-(--border)">
						<span className="text-3xl font-semibold text-(--gold)">{shop.rating.toFixed(1)}</span>
						<span className="text-sm text-(--text-subtle)">
							/ 5 · {t("map.reviewsCount", { count: shop.reviewCount })}
						</span>
					</div>
				)}

				{!reviews ? (
					<div className="space-y-3">
						{[0, 1, 2].map((i) => (
							<Skeleton key={i} className="h-24 w-full rounded-lg" />
						))}
					</div>
				) : reviews.length === 0 ? (
					<p className="text-sm text-(--text-subtle) py-8 text-center">
						{t("business.reviews.noReviews")}
					</p>
				) : (
					<div className="space-y-0 divide-y divide-white/4">
						{reviews.map((r) => (
							<div key={r._id} className="py-5">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-baseline gap-1.5">
										<span className="text-sm font-medium text-(--gold)">{r.rating.toFixed(1)}</span>
										<span className="text-xs text-(--text-subtle)">/ 5</span>
									</div>
									<span className="text-[11px] text-white/25">{formatRelative(r.createdAt)}</span>
								</div>
								<p className="text-sm text-(--text-muted) leading-relaxed">{r.comment}</p>
								{r.ownerReply ? (
									<div className="mt-3 ml-4 pl-3 border-l border-(--gold)/20 text-xs text-(--text-muted) leading-relaxed">
										<span className="text-(--gold)/70 font-medium">{t("business.reviews.yourReply")}</span>{" "}
										{r.ownerReply}
									</div>
								) : replyId === r._id ? (
									<div className="flex gap-2 mt-3">
										<input
											className="flex-1 bg-(--bg-card) border border-(--border) rounded-lg px-3 py-2 text-sm text-(--text) placeholder:text-(--text-subtle) focus:outline-none focus:border-(--gold) transition-colors"
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
											className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-(--gold) text-white text-xs font-medium hover:bg-(--gold-dark) transition-colors"
										>
											<Send size={11} />
											{t("business.reviews.replyButton")}
										</button>
										<button
											type="button"
											onClick={() => setReplyId(null)}
											className="px-3 py-2 rounded-full text-xs text-(--text-muted) hover:text-(--text-muted) transition-colors"
										>
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
										className="mt-2 text-xs text-(--gold)/70 hover:text-(--gold) transition-colors"
									>
										{t("business.reviews.replyAction")}
									</button>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
