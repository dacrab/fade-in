import { clerkMiddleware } from "@clerk/tanstack-react-start/server"
import { createCsrfMiddleware, createStart } from "@tanstack/react-start"

/**
 * Defining `src/start.ts` opts out of TanStack Start's automatic middleware,
 * so CSRF protection for server functions must be registered explicitly here
 * alongside Clerk's auth middleware.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [createCsrfMiddleware(), clerkMiddleware()],
}))
