import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type * as React from "react"
import { cn } from "#/lib/cn"

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
			<BaseDialog.Backdrop className="dialog-backdrop" />
			<BaseDialog.Popup className={cn("dialog-popup", className)}>{children}</BaseDialog.Popup>
		</BaseDialog.Portal>
	)
}

interface DialogHeaderProps {
	children?: React.ReactNode
	onClose?: () => void
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
	return (
		<div className="dialog-header">
			<div>{children}</div>
			{onClose && (
				<BaseDialog.Close
					className="icon-btn"
					style={{ background: "none", border: "none" }}
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
		<BaseDialog.Close className={cn("icon-btn bg-transparent border-0", className)}>
			{children}
		</BaseDialog.Close>
	)
}
