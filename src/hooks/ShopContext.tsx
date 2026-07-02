import { useQuery } from "convex/react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Barbershop } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface ShopContextValue {
	shops: Barbershop[]
	selectedShop: Barbershop | undefined
	setSelectedShopId: (id: Id<"barbershops">) => void
	isLoading: boolean
}

const ShopContext = createContext<ShopContextValue>({
	shops: [],
	selectedShop: undefined,
	setSelectedShopId: () => {},
	isLoading: true,
})

const STORAGE_KEY = "fadein_selected_shop"

export function ShopProvider({
	userId,
	children,
}: {
	userId: Id<"users"> | undefined
	children: React.ReactNode
}) {
	const shopsRaw = useQuery(api.barbershops.listByOwner, userId ? { ownerId: userId } : "skip")
	const shops = (shopsRaw ?? []) as Barbershop[]

	const [selectedId, setSelectedId] = useState<Id<"barbershops"> | null>(() => {
		if (typeof window === "undefined") return null
		const stored = localStorage.getItem(STORAGE_KEY)
		return stored as Id<"barbershops"> | null
	})

	useEffect(() => {
		if (shops.length > 0 && !selectedId) {
			setSelectedId(shops[0]._id)
		}
	}, [shops, selectedId])

	const selectedShop = shops.find((s) => s._id === selectedId) ?? shops[0]

	const setSelectedShopId = (id: Id<"barbershops">) => {
		setSelectedId(id)
		try {
			localStorage.setItem(STORAGE_KEY, id)
		} catch {
			// Ignore
		}
	}

	return (
		<ShopContext.Provider
			value={{
				shops,
				selectedShop,
				setSelectedShopId,
				isLoading: shopsRaw === undefined,
			}}
		>
			{children}
		</ShopContext.Provider>
	)
}

export function useShopContext() {
	return useContext(ShopContext)
}
