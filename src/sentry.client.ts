import * as Sentry from "@sentry/react"

export function initClientSentry() {
	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		environment: import.meta.env.MODE,
		tracesSampleRate: 0.1,
		replaysSessionSampleRate: 0.05,
		replaysOnErrorSampleRate: 1.0,
		debug: false,
		integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
	})
}
