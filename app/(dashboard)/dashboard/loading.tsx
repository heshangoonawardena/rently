import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex-1 space-y-6 px-6 pt-0">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-5 w-64" />
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className="h-52 w-full rounded-xl" />
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className="h-80 w-full rounded-xl" />
				))}
			</div>
		</div>
	);
}
