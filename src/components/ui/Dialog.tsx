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
			<BaseDialog.Backdrop className="dialog-backdrop" />
			<BaseDialog.Popup className={cn("dialog-popup", className)}>{children}</BaseDialog.Popup>
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
		<div className="dialog-header">
			{children}
			{onClose && (
				<BaseDialog.Close className="icon-btn bg-transparent border-0" onClick={onClose}>
					<X size={18} />
				</BaseDialog.Close>
			)}
		</div>
	)
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<BaseDialog.Title className={cn("font-bold text-[var(--text)]", className)}>
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
		<BaseDialog.Description className={cn("text-sm text-[var(--text-muted)]", className)}>
			{children}
		</BaseDialog.Description>
	)
}
