import { Menu as BaseMenu } from "@base-ui/react/menu"
import type { ReactElement, ReactNode } from "react"
import { cn } from "#/lib/cn"

interface MenuItemBase {
	id: string
	disabled?: boolean
}

interface MenuItemAction extends MenuItemBase {
	separator?: false
	label: ReactNode
	onClick?: () => void
	danger?: boolean
	icon?: ReactNode
}

interface MenuItemSeparator extends MenuItemBase {
	separator: true
}

type MenuItem = MenuItemAction | MenuItemSeparator

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
								<BaseMenu.Separator key={item.id} className="my-1 h-px mx-2 bg-[var(--border)]" />
							) : (
								<BaseMenu.Item
									key={item.id}
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
