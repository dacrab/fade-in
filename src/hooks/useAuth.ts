import { useQuery } from "convex/react"
import { useMemo } from "react"
import { parseUserRole, type UserRole } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"

export interface Viewer {
	id: Doc<"users">["_id"]
	name: string
	email: string
	role: UserRole
	favoriteShopIds: NonNullable<Doc<"users">["favoriteShopIds"]>
}

export function useAuth(): { user: Viewer | null; loading: boolean } {
	const viewer = useQuery(api.users.getViewer)

	// Memoized so consumers depending on `user` (e.g. auth-guard effects) don't
	// re-run on every render.
	const user = useMemo<Viewer | null>(
		() =>
			viewer
				? {
						id: viewer._id,
						name: viewer.name ?? viewer.email,
						email: viewer.email,
						role: parseUserRole(viewer.role),
						favoriteShopIds: viewer.favoriteShopIds ?? [],
					}
				: null,
		[viewer],
	)

	return { user, loading: viewer === undefined }
}
