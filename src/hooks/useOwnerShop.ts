import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export function useOwnerShop(userId: string | undefined) {
	const shopsRaw = useQuery(
		api.barbershops.listByOwner,
		userId ? { ownerId: userId as Id<"users"> } : "skip",
	)
	return shopsRaw?.[0]
}
