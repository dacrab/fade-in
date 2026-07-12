import * as Sentry from "@sentry/react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { useSyncExternalStore } from "react"

type ToastType = "success" | "error" | "info"

interface Toast {
	id: number
	type: ToastType
	message: string
}

const TOAST_TTL = 4000

let toasts: Toast[] = []
let toastId = 0
const listeners = new Set<() => void>()

function emit() {
	for (const listener of listeners) listener()
}

export function showToast(message: string, type: ToastType = "info") {
	const id = ++toastId
	toasts = [...toasts, { id, type, message }]
	emit()
	setTimeout(() => {
		toasts = toasts.filter((t) => t.id !== id)
		emit()
	}, TOAST_TTL)
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
	} catch (e) {
		showToast(error, "error")
		Sentry.captureException(e)
	}
}

const TOAST_CONFIG = {
	success: { icon: CheckCircle, borderColor: "var(--success)" },
	error: { icon: AlertCircle, borderColor: "var(--error)" },
	info: { icon: Info, borderColor: "var(--gold)" },
} as const

export function ToastContainer() {
	const current = useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => {
				listeners.delete(cb)
			}
		},
		() => toasts,
	)

	return (
		<div className="toast-container">
			{current.map((toast) => {
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
