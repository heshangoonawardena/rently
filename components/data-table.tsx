"use client";

import * as React from "react";
import {
	ColumnDef,
	type Table as TableType,
	flexRender,
	getCoreRowModel,
	useReactTable,
	SortingState,
	getSortedRowModel,
	ColumnFiltersState,
	getFilteredRowModel,
	getPaginationRowModel,
	getExpandedRowModel,
	//   type VisibilityState,
	getFacetedRowModel,
	getFacetedUniqueValues,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "@/components/data-table-pagination";
import {
	DataTableToolbar,
	type FacetedFilterOption,
} from "@/components/data-table-toolbar";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	renderRowSubComponent?: (row: any) => React.ReactNode;
	facetedFilters?: FacetedFilterOption[];
	renderToolbarActions?: (table: TableType<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	renderRowSubComponent,
	facetedFilters,
	renderToolbarActions,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [globalFilter, setGlobalFilter] = React.useState("");
	//   const [rowSelection, setRowSelection] = React.useState({})
	//   const [columnVisibility, setColumnVisibility] =
	//     React.useState<VisibilityState>({})

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		// allow rows to be expandable even without subRows (we render a subcomponent)
		getRowCanExpand: () => true,
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: "includesString",
		onGlobalFilterChange: setGlobalFilter,
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			sorting,
			columnFilters,
			globalFilter,
			//       columnVisibility,
			//       rowSelection,
		},
		//     enableRowSelection: true,
		//     onRowSelectionChange: setRowSelection,
		//     onColumnVisibilityChange: setColumnVisibility,
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="space-y-4">
			<DataTableToolbar
				table={table}
				facetedFilters={facetedFilters}
				renderActions={renderToolbarActions}
			/>
			<div className="rounded-md border">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-background shadow-md">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<React.Fragment key={row.id}>
									<TableRow data-state={row.getIsSelected() && "selected"}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
									{row.getIsExpanded() && renderRowSubComponent && (
										<TableRow>
											<TableCell colSpan={row.getVisibleCells().length}>
												{renderRowSubComponent(row)}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
