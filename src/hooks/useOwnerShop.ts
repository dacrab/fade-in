import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export function useOwnerShop(userId: Id<"users"> | undefined) {
	const shopsRaw = useQuery(api.barbershops.listByOwner, userId ? { ownerId: userId } : "skip")
	return shopsRaw?.[0]
}
