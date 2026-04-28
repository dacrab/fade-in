import { useMutation } from "convex/react"
import { X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { StarRating } from "./ui/StarRating"
import { showToast } from "./ui/Toast"

interface Props {
	appointmentId: Id<"appointments">
	barbershopId: Id<"barbershops">
	customerId: Id<"users">
	shopName: string
	onClose: () => void
	onSuccess: () => void
}

export default function ReviewModal({
	appointmentId,
	barbershopId,
	customerId,
	shopName,
	onClose,
	onSuccess,
}: Props) {
	const { t } = useTranslation()
	const [rating, setRating] = useState(0)
	const [comment, setComment] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const createReview = useMutation(api.reviews.create)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (rating === 0) {
			showToast(t("errors.ratingRequired"), "error")
			return
		}
		if (!comment.trim()) {
			showToast(t("errors.commentRequired"), "error")
			return
		}

		setSubmitting(true)
		try {
			await createReview({
				customerId,
				barbershopId,
				appointmentId,
				rating,
				comment: comment.trim(),
			})
			showToast(t("errors.reviewSubmitted"), "success")
			onSuccess()
			onClose()
		} catch {
			showToast(t("errors.reviewFailed"), "error")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
			<div className="card p-6 max-w-md w-full">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-[var(--text)]">{t("review.title")}</h2>
					<button type="button" onClick={onClose} className="icon-btn">
						<X size={18} />
					</button>
				</div>

				<p className="text-sm text-[var(--text-muted)] mb-4">
					{t("review.subtitle", { shop: shopName })}
				</p>

				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
					<div>
						<div className="form-label">{t("review.ratingLabel")}</div>
						<div className="flex justify-center py-2">
							<StarRating rating={rating} onRate={setRating} interactive max={5} size={32} />
						</div>
					</div>

					<div>
						<label className="form-label" htmlFor="review-comment">
							{t("review.commentLabel")}
						</label>
						<textarea
							id="review-comment"
							className="input resize-none"
							rows={4}
							placeholder={t("review.commentPlaceholder")}
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							maxLength={500}
							required
						/>
						<p className="text-xs text-[var(--text-subtle)] mt-1">
							{comment.length}/500 {t("common.characters")}
						</p>
					</div>

					<div className="flex gap-2">
						<button
							type="submit"
							disabled={submitting || rating === 0}
							className="btn btn-primary flex-1"
						>
							{submitting ? t("common.submitting") : t("review.submit")}
						</button>
						<button type="button" onClick={onClose} className="btn btn-secondary">
							{t("common.cancel")}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
