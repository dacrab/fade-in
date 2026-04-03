import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, d MMMM yyyy')
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy')
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export function formatRelative(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

export function getDaysOfWeek() {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
