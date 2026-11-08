import { StartClient } from "@tanstack/react-start/client"
import { StrictMode, startTransition } from "react"
import { hydrateRoot } from "react-dom/client"

// Loaded after the entry chunk so the SDK is not part of first paint. Errors
// thrown before it resolves are still caught by the router's error boundary;
// only their automatic Sentry capture is skipped.
void import("./sentry.client").then(({ initClientSentry }) => initClientSentry())

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<StartClient />
		</StrictMode>,
	)
})
