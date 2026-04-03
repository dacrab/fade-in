import { Slider as BaseSlider } from '@base-ui/react/slider'
import { cn } from '../../lib/cn'

interface SliderProps {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({ value, defaultValue, onValueChange, min = 0, max = 100, step = 1, className }: SliderProps) {
  return (
    <BaseSlider.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
    >
      <BaseSlider.Control className="relative w-full py-4">
        <BaseSlider.Track
          className="relative h-1.5 w-full rounded-full overflow-visible"
          style={{ background: 'var(--border)' }}
        >
          <BaseSlider.Indicator
            className="absolute h-full rounded-full"
            style={{ background: 'var(--gold)' }}
          />
          <BaseSlider.Thumb
            className="absolute block h-4 w-4 rounded-full shadow-md outline-none cursor-grab active:cursor-grabbing transition-transform hover:scale-110 focus-visible:ring-2"
            style={{
              background: 'var(--gold)',
              border: '2px solid var(--bg)',
              top: '50%',
              transform: 'translateX(-50%) translateY(-50%)',
            }}
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}
