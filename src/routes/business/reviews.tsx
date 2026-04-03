import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { MessageSquare, Send } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import { StarRating } from "../../components/ui/StarRating"
import { formatRelative } from "../../lib/format"
import { showToast } from "../../components/ui/Toast"
import type { Barbershop, Review } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/reviews")({ component: BusinessReviews })

function BusinessReviews() {
	const { user } = useAuth()
	const shopsRaw = useQuery(api.barbershops.listByOwner, user ? { ownerId: user.id as Id<"users"> } : "skip")
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
			showToast("Reply added!", "success")
			setReplyId(null)
			setReplyText("")
		} catch { showToast("Failed to add reply", "error") }
	}

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-3xl">
				<div className="flex items-center gap-3 mb-6">
					<Link to="/business" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] no-underline">← Dashboard</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">Reviews</h1>
				</div>

				{shop && (
					<div className="card p-4 mb-6 flex items-center gap-4">
						<div className="text-4xl font-bold text-[var(--gold)]">{shop.rating.toFixed(1)}</div>
						<div>
							<StarRating rating={shop.rating} size={18} />
							<p className="text-sm text-[var(--text-muted)] mt-0.5">{shop.reviewCount} reviews</p>
						</div>
					</div>
				)}

				{reviews === undefined ? (
					<div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
				) : reviews.length === 0 ? (
					<div className="text-center py-16 text-[var(--text-muted)]">
						<MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
						<p className="text-sm">No reviews yet. Keep providing great service!</p>
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
										<span className="text-[var(--gold)] font-semibold">Your reply: </span>{r.ownerReply}
									</div>
								) : replyId === r._id ? (
									<div className="flex gap-2 mt-2">
										<input
											className="input text-sm"
											placeholder="Write a reply..."
											value={replyText}
											onChange={(e) => setReplyText(e.target.value)}
											onKeyDown={(e) => { if (e.key === "Enter") void handleReply(r._id) }}
										/>
										<button type="button" onClick={() => void handleReply(r._id)} className="btn btn-primary text-sm px-3 gap-1"><Send size={13} />Reply</button>
										<button type="button" onClick={() => setReplyId(null)} className="btn btn-ghost text-sm">Cancel</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => { setReplyId(r._id); setReplyText("") }}
										className="text-xs text-[var(--gold)] hover:underline"
										style={{ background: "none", border: "none", cursor: "pointer" }}
									>
										Reply to this review
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
