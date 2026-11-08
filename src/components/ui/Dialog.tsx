import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
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
			<BaseDialog.Backdrop className="fixed inset-0 z-50 bg-[#191512]/45 backdrop-blur-[2px]" />
			<BaseDialog.Popup
				className={cn(
					"fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card) shadow-[var(--shadow-md)]",
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
	const { t } = useTranslation()
	return (
		<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
			<div className="space-y-1 flex-1">{children}</div>
			{onClose && (
				<BaseDialog.Close
					aria-label={t("common.close")}
					className="rounded-(--radius) p-1.5 text-(--text-subtle) transition-colors hover:bg-(--bg-input) hover:text-(--text-muted)"
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
		<BaseDialog.Title
			className={cn("font-serif text-xl font-medium text-(--text) tracking-[-0.02em]", className)}
		>
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
