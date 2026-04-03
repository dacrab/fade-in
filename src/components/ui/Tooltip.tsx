import type * as React from "react"
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"

interface TooltipProps {
	children: React.ReactElement
	content: React.ReactNode
	side?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
	return (
		<BaseTooltip.Provider>
			<BaseTooltip.Root>
				<BaseTooltip.Trigger render={children} />
				<BaseTooltip.Portal>
					<BaseTooltip.Positioner side={side} sideOffset={6}>
						<BaseTooltip.Popup
							className="z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg"
							style={{
								background: "var(--bg-card)",
								color: "var(--text)",
								border: "1px solid var(--border)",
							}}
						>
							{content}
							<BaseTooltip.Arrow className="fill-[var(--border)]" />
						</BaseTooltip.Popup>
					</BaseTooltip.Positioner>
				</BaseTooltip.Portal>
			</BaseTooltip.Root>
		</BaseTooltip.Provider>
	)
}
