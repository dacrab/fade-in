/**
 * FadeIn's mark: an "F" whose stem tapers away like a clipper fade.
 * Shared by the header, footer, and auth screen so the brand stays
 * consistent with the favicon.
 */
export default function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			width={size}
			height={size}
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<rect width="64" height="64" rx="14" fill="var(--gold)" />
			<path d="M18.5 14.5H47V21.5H25.5V27.5H40.5V34.5H25.5L21.5 49.5H18.5V14.5Z" fill="#FFFAF5" />
		</svg>
	)
}
