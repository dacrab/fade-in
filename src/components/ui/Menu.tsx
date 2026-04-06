import { Menu as BaseMenu } from "@base-ui/react/menu"
import type { ReactElement, ReactNode } from "react"
import { cn } from "#/lib/cn"

export interface MenuItem {
	label: ReactNode
	onClick?: () => void
	danger?: boolean
	disabled?: boolean
	separator?: boolean
	icon?: ReactNode
	id?: string
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
				<BaseMenu.Positioner align={align} sideOffset={6}>
					<BaseMenu.Popup className="popup min-w-[10rem]">
						{items.map((item) =>
							item.separator ? (
								<BaseMenu.Separator
									key={item.id || `sep-${Math.random()}`}
									className="my-1 h-px mx-2 bg-[var(--border)]"
								/>
							) : (
								<BaseMenu.Item
									key={item.id || (typeof item.label === "string" ? item.label : `item-${Math.random()}`)}
									disabled={item.disabled}
									onClick={item.onClick}
									className={cn(
										"popup-item",
										item.danger && "danger",
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
