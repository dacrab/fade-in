import EmptyState from "./EmptyState"
import SkeletonList from "./SkeletonList"

interface Props<T> {
	data: T[] | undefined
	skeleton?: { count: number; height: string }
	empty: { icon: React.ElementType; message: string }
	children: (items: T[]) => React.ReactNode
}

export default function AsyncList<T>({ data, skeleton = { count: 3, height: "h-20" }, empty, children }: Props<T>) {
	if (data === undefined) return <SkeletonList count={skeleton.count} height={skeleton.height} />
	if (data.length === 0) return <EmptyState icon={empty.icon} message={empty.message} />
	return <>{children(data)}</>
}
