import type { Table } from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type CursorPaginationState = {
	currentPage: number;
	pageSize: number;
	canPreviousPage: boolean;
	canNextPage: boolean;
	onPageSizeChange: (pageSize: number) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
};

type ClientPaginationProps<TData> = {
	table: Table<TData>;
	pagination?: never;
};

type CursorPaginationProps = {
	table?: never;
	pagination: CursorPaginationState;
};

export type DataTablePaginationProps<TData> =
	| ClientPaginationProps<TData>
	| CursorPaginationProps;

export function DataTablePagination<TData>(
	props: DataTablePaginationProps<TData>,
) {
	const pagination = "pagination" in props ? props.pagination : undefined;
	const table = "table" in props ? props.table : undefined;

	if (pagination) {
		return (
			<div className="flex items-center justify-end px-2">
				<div className="flex items-center space-x-6 lg:space-x-8">
					<div className="flex items-center space-x-2">
						<p className="text-sm font-medium">Rows per page</p>
						<Select
							value={`${pagination.pageSize}`}
							onValueChange={(value) => {
								pagination.onPageSizeChange(Number(value));
							}}
						>
							<SelectTrigger className="h-8 w-17.5">
								<SelectValue placeholder={pagination.pageSize} />
							</SelectTrigger>
							<SelectContent side="top">
								{[10, 30, 50, 100].map((pageSize) => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex min-w-25 items-center justify-center text-sm font-medium">
						Page {pagination.currentPage}
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="icon"
							className="size-8"
							onClick={pagination.onPreviousPage}
							disabled={!pagination.canPreviousPage}
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeft />
						</Button>
						<Button
							variant="outline"
							size="icon"
							className="size-8"
							onClick={pagination.onNextPage}
							disabled={!pagination.canNextPage}
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRight />
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!table) {
		return null;
	}

	return (
		<div className="flex items-center justify-end px-2">
			{/* <div className="flex-1 text-sm text-muted-foreground">
				{table.getFilteredSelectedRowModel().rows.length} of{" "}
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div> */}
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-17.5">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 25, 30, 40, 50, 100].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-25 items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{table.getPageCount()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to first page</span>
						<ChevronsLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRight />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to last page</span>
						<ChevronsRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
