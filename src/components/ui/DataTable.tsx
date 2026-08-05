import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { SkeletonRows } from "./Skeleton"

interface DataTableProps<TData> {
	columns: ColumnDef<TData>[]
	data: TData[]
	loading?: boolean
	loadingRows?: number
	emptyMessage?: string
	searchable?: boolean
	searchPlaceholder?: string
}

export function DataTable<TData extends { _id: string }>({
	columns,
	data,
	loading,
	loadingRows = 5,
	emptyMessage,
	searchable,
	searchPlaceholder,
}: DataTableProps<TData>) {
	const { t } = useTranslation()
	const [sorting, setSorting] = useState<SortingState>([])
	const [globalFilter, setGlobalFilter] = useState("")

	const table = useReactTable({
		data,
		columns,
		state: { sorting, globalFilter },
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 15 } },
	})

	if (loading) {
		return (
			<div className="space-y-3">
				<SkeletonRows count={loadingRows} className="h-12" />
			</div>
		)
	}

	if (data.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="muted-sm">{emptyMessage ?? t("common.noData")}</p>
			</div>
		)
	}

	return (
		<div>
			{searchable && (
				<div className="mb-4">
					<input
						className="input w-full max-w-xs text-sm"
						placeholder={searchPlaceholder ?? t("common.search")}
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
					/>
				</div>
			)}
			<div className="overflow-x-auto rounded-xl border border-(--border)">
				<table className="w-full">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="border-b border-(--border) bg-(--bg-input)/30">
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-4 py-3 text-left text-xs font-semibold text-(--text-muted) select-none"
										style={{ width: header.getSize() }}
									>
										{header.isPlaceholder ? null : (
											<button
												type="button"
												className={`inline-flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer hover:text-(--text)" : ""}`}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{{
													asc: <ChevronUp size={12} />,
													desc: <ChevronDown size={12} />,
												}[String(header.column.getIsSorted())] ??
													(header.column.getCanSort() ? (
														<ChevronsUpDown size={12} className="opacity-30" />
													) : null)}
											</button>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="border-b border-(--border) last:border-0 hover:bg-(--bg-input)/20 transition-colors"
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-4 py-3 main-sm">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex items-center justify-between mt-4 muted-xs">
				<span>
					{t("common.page", {
						page: table.getState().pagination.pageIndex + 1,
						total: table.getPageCount(),
					})}
				</span>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						className="p-1.5 rounded-md hover:bg-(--bg-input) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					>
						<ChevronLeft size={14} />
					</button>
					<button
						type="button"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						className="p-1.5 rounded-md hover:bg-(--bg-input) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					>
						<ChevronRight size={14} />
					</button>
				</div>
			</div>
		</div>
	)
}
