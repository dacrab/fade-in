import type * as React from "react"
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { cn } from "../../lib/cn"
import { X } from "lucide-react"

interface DialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
	return (
		<BaseDialog.Root open={open} onOpenChange={onOpenChange}>
			{children}
		</BaseDialog.Root>
	)
}

interface DialogContentProps {
	children: React.ReactNode
	className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop
				style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
				className="fixed inset-0 z-50"
			/>
			<BaseDialog.Popup
				className={cn(
					"fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
					"w-full max-w-lg max-h-[90vh] overflow-y-auto",
					"rounded-2xl border border-[var(--border)] shadow-2xl",
					"transition-all duration-200",
					className,
				)}
				style={{ background: "var(--bg-card)" }}
			>
				{children}
			</BaseDialog.Popup>
		</BaseDialog.Portal>
	)
}

interface DialogHeaderProps {
	children?: React.ReactNode
	onClose?: () => void
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
	return (
		<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
			<div>{children}</div>
			{onClose && (
				<BaseDialog.Close
					className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)] transition-colors"
					style={{ background: "none", border: "none", cursor: "pointer" }}
					onClick={onClose}
				>
					<X size={18} />
				</BaseDialog.Close>
			)}
		</div>
	)
}

interface DialogTitleProps {
	children: React.ReactNode
	className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
	return (
		<BaseDialog.Title className={cn("font-bold text-[var(--text)]", className)}>
			{children}
		</BaseDialog.Title>
	)
}

interface DialogDescriptionProps {
	children: React.ReactNode
	className?: string
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
	return (
		<BaseDialog.Description className={cn("text-sm text-[var(--text-muted)]", className)}>
			{children}
		</BaseDialog.Description>
	)
}

interface DialogCloseProps {
	children: React.ReactNode
	className?: string
}

export function DialogClose({ children, className }: DialogCloseProps) {
	return (
		<BaseDialog.Close
			className={cn(className)}
			style={{ background: "none", border: "none", cursor: "pointer" }}
		>
			{children}
		</BaseDialog.Close>
	)
}
