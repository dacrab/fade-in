import { Select as BaseSelect } from "@base-ui/react/select"
import { cn } from "../../lib/cn"
import { ChevronDown, Check } from "lucide-react"

interface SelectOption {
	value: string
	label: string
}

interface SelectProps {
	value?: string
	onValueChange?: (value: string) => void
	options: SelectOption[]
	placeholder?: string
	className?: string
	disabled?: boolean
}

export function Select({
	value,
	onValueChange,
	options,
	placeholder = "Select...",
	className,
	disabled,
}: SelectProps) {
	return (
		<BaseSelect.Root
			value={value}
			onValueChange={(val) => val !== null && onValueChange?.(val)}
			disabled={disabled}
		>
			<BaseSelect.Trigger
				className={cn(
					"input flex items-center justify-between gap-2 cursor-pointer",
					"data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
					className,
				)}
			>
				<BaseSelect.Value
					placeholder={<span className="text-[var(--text-subtle)]">{placeholder}</span>}
				/>
				<BaseSelect.Icon>
					<ChevronDown size={14} className="text-[var(--text-muted)]" />
				</BaseSelect.Icon>
			</BaseSelect.Trigger>

			<BaseSelect.Portal>
				<BaseSelect.Positioner sideOffset={4}>
					<BaseSelect.Popup className="popup min-w-[8rem]">
						<BaseSelect.ScrollUpArrow className="flex justify-center py-1 text-[var(--text-muted)] text-xs">▲</BaseSelect.ScrollUpArrow>
						{options.map((opt) => (
							<BaseSelect.Item key={opt.value} value={opt.value} className="popup-item">
								<BaseSelect.ItemIndicator className="flex-shrink-0">
									<Check size={13} className="text-[var(--gold)]" />
								</BaseSelect.ItemIndicator>
								<BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
							</BaseSelect.Item>
						))}
						<BaseSelect.ScrollDownArrow className="flex justify-center py-1 text-[var(--text-muted)] text-xs">▼</BaseSelect.ScrollDownArrow>
					</BaseSelect.Popup>
				</BaseSelect.Positioner>
			</BaseSelect.Portal>
		</BaseSelect.Root>
	)
}
