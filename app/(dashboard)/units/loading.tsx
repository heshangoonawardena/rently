import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex-1 space-y-6 px-6 pt-0">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-5 w-64" />
				</div>

				<Skeleton className="h-9 w-32 rounded-md" />
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className="h-52 w-full rounded-xl" />
				))}
			</div>

			{/* Leases Table */}
			<div className="space-y-4">
				{/* Table toolbar */}
				<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
					<Skeleton className="h-9 w-64 rounded-md" />

					<div className="flex gap-2">
						<Skeleton className="h-9 w-24 rounded-md" />
						<Skeleton className="h-9 w-24 rounded-md" />
					</div>
				</div>

				{/* Table */}
				<div className="overflow-hidden rounded-xl border">
					<div className="space-y-0">
						{/* Table header */}
						<div className="flex h-12 items-center gap-4 border-b px-4">
							<Skeleton className="h-4 w-8" />
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="ml-auto h-4 w-16" />
						</div>

						{/* Table rows */}
						{Array.from({ length: 7 }).map((_, index) => (
							<div
								key={index}
								className="flex h-16 items-center gap-4 border-b px-4"
							>
								<Skeleton className="h-4 w-8" />
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-20 rounded-full" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="ml-auto h-8 w-8 rounded-md" />
							</div>
						))}
					</div>
				</div>

				{/* Pagination */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />

					<div className="flex gap-2">
						<Skeleton className="h-9 w-20 rounded-md" />
						<Skeleton className="h-9 w-20 rounded-md" />
					</div>
				</div>
			</div>
		</div>
	);
}
