import { useState, useCallback, useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
	id: number
	type: ToastType
	message: string
}

let toastId = 0
let globalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null

export function showToast(message: string, type: ToastType = "info"): void {
	if (globalSetToasts) {
		const id = ++toastId
		globalSetToasts((prev) => [...prev, { id, type, message }])
		setTimeout(() => {
			globalSetToasts?.((prev) => prev.filter((t) => t.id !== id))
		}, 4000)
	}
}

const ICONS: Record<ToastType, typeof CheckCircle> = {
	success: CheckCircle,
	error: AlertCircle,
	info: Info,
}

const COLORS: Record<ToastType, string> = {
	success: "border-green-500/30 bg-green-500/10 text-green-400",
	error: "border-red-500/30 bg-red-500/10 text-red-400",
	info: "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]",
}

export function ToastContainer() {
	const [toasts, setToasts] = useState<Toast[]>([])

	useEffect(() => {
		globalSetToasts = setToasts
		return () => { globalSetToasts = null }
	}, [])

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	return (
		<div className="toast-container">
			{toasts.map((toast) => {
				const Icon = ICONS[toast.type]
				return (
					<div
						key={toast.id}
						className={`fade-up flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg ${COLORS[toast.type]}`}
						style={{ background: "rgba(10,10,10,0.9)" }}
					>
						<Icon size={18} className="flex-shrink-0 mt-0.5" />
						<span className="text-sm text-[var(--text)] flex-1">{toast.message}</span>
						<button
							type="button"
							onClick={() => dismiss(toast.id)}
							className="icon-btn flex-shrink-0"
							style={{ background: "none", border: "none", color: "var(--text-muted)" }}
						>
							<X size={14} />
						</button>
					</div>
				)
			})}
		</div>
	)
}
