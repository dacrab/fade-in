import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "#/lib/cn"

export const Dialog = BaseDialog.Root

export function DialogContent({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop className="fixed inset-0 bg-black/30 z-50" />
			<BaseDialog.Popup
				className={cn(
					"fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] bg-(--bg-card) rounded-2xl shadow-xl border border-(--border) overflow-hidden",
					className,
				)}
			>
				{children}
			</BaseDialog.Popup>
		</BaseDialog.Portal>
	)
}

export function DialogHeader({
	children,
	onClose,
}: {
	children?: ReactNode
	onClose?: () => void
}) {
	return (
		<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
			<div className="space-y-1 flex-1">{children}</div>
			{onClose && (
				<BaseDialog.Close
					className="rounded-lg p-1.5 text-(--text-subtle) hover:text-(--text-muted) hover:bg-(--bg-input) transition-colors border-0 bg-transparent cursor-pointer"
					onClick={onClose}
				>
					<X size={16} />
				</BaseDialog.Close>
			)}
		</div>
	)
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<BaseDialog.Title className={cn("font-semibold text-(--text) tracking-tight", className)}>
			{children}
		</BaseDialog.Title>
	)
}

export function DialogDescription({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<BaseDialog.Description className={cn("muted-sm leading-relaxed", className)}>
			{children}
		</BaseDialog.Description>
	)
}
