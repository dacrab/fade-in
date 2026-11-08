import { clerkFrontendApiProxy, matchProxyPath } from "@clerk/backend/proxy"
import { clerkMiddleware } from "@clerk/tanstack-react-start/server"
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start"

/**
 * Serves Clerk's Frontend API under `/__clerk`. Clerk is configured with a
 * path-based proxy for this domain, so ClerkJS assets and API calls must be
 * forwarded to Clerk from our own origin.
 */
const PROXY_PATH = "/__clerk"

const clerkProxy = createMiddleware().server(({ request, next }) => {
	if (!matchProxyPath(request, { proxyPath: PROXY_PATH })) return next()

	return clerkFrontendApiProxy(request, {
		proxyPath: PROXY_PATH,
		publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
		secretKey: process.env.CLERK_SECRET_KEY,
	})
})

/**
 * Defining `src/start.ts` opts out of TanStack Start's automatic middleware,
 * so CSRF protection for server functions must be registered explicitly here
 * alongside Clerk's auth middleware.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [
		clerkProxy,
		// Only server function calls need CSRF checks. Applying this to page
		// requests rejects normal navigations, which arrive as `Sec-Fetch-Site:
		// none` or `cross-site`.
		createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
		clerkMiddleware(),
	],
}))
