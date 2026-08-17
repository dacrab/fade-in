import { useClerk, useUser } from "@clerk/tanstack-react-start"
import { useQuery } from "convex/react"
import { parseUserRole } from "#/types"
import { api } from "../../convex/_generated/api"

export function useAuth() {
	const { signOut } = useClerk()
	const { isLoaded } = useUser()
	const viewer = useQuery(api.users.getViewer)

	const user = viewer
		? {
				id: viewer._id,
				name: viewer.name ?? viewer.email,
				email: viewer.email,
				role: parseUserRole(viewer.role),
				avatarUrl: viewer.avatarUrl,
				favoriteShopIds: viewer.favoriteShopIds ?? [],
			}
		: null

	return {
		user,
		loading: viewer === undefined,
		signOut,
		isLoaded,
	}
}
