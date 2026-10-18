import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

/**
 * The shop owned by the signed-in user (resolved server-side from the auth
 * context). Pass `enabled: false` to skip the query until auth has loaded.
 * The product currently allows a single shop per owner, so only the first is
 * returned. `isLoading` distinguishes "still resolving" from "no shop yet".
 */
export function useOwnerShop(enabled: boolean) {
	const shops = useQuery(api.barbershops.listByOwner, enabled ? {} : "skip")
	return { shop: shops?.[0], isLoading: enabled && shops === undefined }
}
