"use client";

import type { Table } from "@tanstack/react-table";
import { RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table-view-options";

export interface FacetedFilterOption {
	title: string;
	columnId: string;
	options: {
		label: string;
		value: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[];
}

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	facetedFilters?: FacetedFilterOption[];
	renderActions?: (table: Table<TData>) => React.ReactNode;
}

export function DataTableToolbar<TData>({
	table,
	facetedFilters,
	renderActions,
}: DataTableToolbarProps<TData>) {
	const isFiltered =
		table.getState().columnFilters.length > 0 ||
		Boolean(table.getState().globalFilter);

	const handleResetFilters = () => {
		table.resetColumnFilters();
		table.resetGlobalFilter();
	};

	return (
		<div className="space-y-4" suppressHydrationWarning>
			{/* Global Search */}
			<div
				className="flex items-center justify-between"
				suppressHydrationWarning
			>
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search anything..."
						value={table.getState().globalFilter ?? ""}
						onChange={(event) =>
							table.setGlobalFilter(String(event.target.value))
						}
						className="max-w-sm pl-9"
					/>
				</div>
			</div>

			<div
				className="flex flex-wrap items-center justify-between gap-2"
				suppressHydrationWarning
			>
				{/* Filters & Reset Filters*/}
				<div className="flex flex-wrap items-center gap-2">
					{facetedFilters &&
						facetedFilters.length > 0 &&
						facetedFilters.map((filter) => {
							const column = table.getColumn(filter.columnId);
							if (!column) {
								return null;
							}

							return (
								<DataTableFacetedFilter
									key={filter.columnId}
									column={column}
									title={filter.title}
									options={filter.options}
								/>
							);
						})}
					{facetedFilters && facetedFilters.length > 0 && (
						<Button
							variant="outline"
							onClick={handleResetFilters}
							className="h-8 px-3"
							disabled={!isFiltered}
						>
							<RefreshCcw className="size-4" />
							<span className="hidden lg:block">Reset Filters</span>
						</Button>
					)}
				</div>

				{/* Export & View */}
				<div className="flex items-center space-x-2">
					{renderActions?.(table)}
					<DataTableViewOptions table={table} />
				</div>
			</div>
		</div>
	);
}
