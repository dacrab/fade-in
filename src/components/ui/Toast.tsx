import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { useEffect, useState } from "react"

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
	success: { icon: CheckCircle, borderColor: "var(--success)" },
	error: { icon: AlertCircle, borderColor: "var(--error)" },
	info: { icon: Info, borderColor: "var(--gold)" },
} as const

export function ToastContainer() {
	const [toasts, setToasts] = useState<Toast[]>([])

	useEffect(() => {
		globalSetToasts = setToasts
		return () => {
			globalSetToasts = null
		}
	}, [])

	return (
		<div className="toast-container">
			{toasts.map((toast) => {
				const { icon: Icon, borderColor } = TOAST_CONFIG[toast.type]
				return (
					<div
						key={toast.id}
						className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-(--bg-card) shadow-md border border-(--border) animate-in slide-in-from-top-2"
						style={{ borderLeft: `3px solid ${borderColor}`, color: borderColor } as React.CSSProperties}
					>
						<Icon size={15} className="flex-shrink-0" />
						<span className="text-[13px] text-(--text) font-medium">{toast.message}</span>
					</div>
				)
			})}
		</div>
	)
}
