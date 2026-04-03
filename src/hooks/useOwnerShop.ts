import { useQuery } from "convex/react"
import type { Barbershop } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useAuth } from "./useAuth"

/** Returns the first shop owned by the current user. */
export function useOwnerShop(): Barbershop | undefined {
	const { user } = useAuth()
	const shopsRaw = useQuery(
		api.barbershops.listByOwner,
		user ? { ownerId: user.id as Id<"users"> } : "skip",
	)
	return shopsRaw?.[0] as Barbershop | undefined
}
