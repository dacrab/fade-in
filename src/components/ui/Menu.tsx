import { Menu as BaseMenu } from "@base-ui/react/menu"
import type { ReactElement, ReactNode } from "react"
import { cn } from "#/lib/cn"

type MenuItem =
	| { id: string; separator: true; disabled?: boolean }
	| {
			id: string
			separator?: false
			label: ReactNode
			onClick?: () => void
			danger?: boolean
			icon?: ReactNode
			disabled?: boolean
	  }

interface MenuProps {
	trigger: ReactElement
	items: MenuItem[]
	align?: "start" | "end" | "center"
}

export function Menu({ trigger, items, align = "end" }: MenuProps) {
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger render={trigger} />
			<BaseMenu.Portal>
				<BaseMenu.Positioner align={align} sideOffset={16}>
					<BaseMenu.Popup className="min-w-[11rem] rounded-xl border border-(--border) bg-white shadow-lg p-1.5">
						{items.map((item) =>
							item.separator ? (
								<BaseMenu.Separator key={item.id} className="my-1.5 h-px mx-2 bg-(--bg-input)" />
							) : (
								<BaseMenu.Item
									key={item.id}
									disabled={item.disabled}
									onClick={item.onClick}
									className={cn(
										"flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors text-(--text-muted) hover:text-(--text) hover:bg-(--bg-card-hover)",
										item.danger && "text-red-500 hover:text-red-600 hover:bg-red-50",
										item.disabled && "opacity-40 cursor-not-allowed",
									)}
								>
									{item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
									{item.label}
								</BaseMenu.Item>
							),
						)}
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	)
}
