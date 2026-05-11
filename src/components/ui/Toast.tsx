import { AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type ToastType = "success" | "error" | "info"

interface Toast {
	id: number
	type: ToastType
	message: string
}

let toastId = 0
let globalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null

export function showToast(message: string, type: ToastType = "info") {
	if (globalSetToasts) {
		const id = ++toastId
		globalSetToasts((prev) => [...prev, { id, type, message }])
		setTimeout(() => {
			globalSetToasts?.((prev) => prev.filter((t) => t.id !== id))
		}, 4000)
	}
}

export async function withToast<T>(
	fn: () => Promise<T>,
	success: string,
	error: string,
): Promise<T | undefined> {
	try {
		const result = await fn()
		showToast(success, "success")
		return result
	} catch {
		showToast(error, "error")
	}
}

const TOAST_CONFIG = {
	success: { icon: CheckCircle, color: "border-green-500/30 bg-green-500/10 text-green-400" },
	error: { icon: AlertCircle, color: "border-red-500/30 bg-red-500/10 text-red-400" },
	info: { icon: Info, color: "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]" },
} as const

export function ToastContainer() {
	const [toasts, setToasts] = useState<Toast[]>([])

	useEffect(() => {
		globalSetToasts = setToasts
		return () => {
			globalSetToasts = null
		}
	}, [])

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	return (
		<div className="toast-container">
			{toasts.map((toast) => {
				const { icon: Icon, color } = TOAST_CONFIG[toast.type]
				return (
					<div
						key={toast.id}
						className={`fade-up flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg bg-black/90 ${color}`}
					>
						<Icon size={18} className="flex-shrink-0 mt-0.5" />
						<span className="text-sm text-[var(--text)] flex-1">{toast.message}</span>
						<button
							type="button"
							onClick={() => dismiss(toast.id)}
							className="icon-btn flex-shrink-0 bg-transparent border-0 text-app-muted"
						>
							<X size={14} />
						</button>
					</div>
				)
			})}
		</div>
	)
}
