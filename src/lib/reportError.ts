/**
 * Report an error to Sentry without pulling the SDK into the entry bundle.
 * The import resolves to a separate chunk only after an error actually occurs;
 * if it fails (offline, blocked), reporting stays best-effort and the UI is
 * unaffected.
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
	void import("@sentry/react")
		.then((Sentry) => {
			Sentry.captureException(error, context ? { extra: context } : undefined)
		})
		.catch(() => {
			// Reporting must never throw into the caller's error path.
		})
}
