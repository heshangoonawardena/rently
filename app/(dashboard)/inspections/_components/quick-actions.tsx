"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AddInspectionModal } from "@/components/inspection-overview-card/add-inspection-modal";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/role";

type QuickActionsProps = {
	role: Role;
	initialRefreshedAt: string;
};

function formatRelativeTime(date: Date, now: Date) {
	const seconds = Math.max(
		0,
		Math.floor((now.getTime() - date.getTime()) / 1000),
	);

	if (seconds < 15) {
		return "just now";
	}

	if (seconds < 60) {
		return `${seconds}s ago`;
	}

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) {
		return `${minutes}m ago`;
	}

	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function QuickActions({
	role,
	initialRefreshedAt,
}: QuickActionsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [lastRefreshedAt, setLastRefreshedAt] = useState(
		() => new Date(initialRefreshedAt),
	);
	const [now, setNow] = useState(() => new Date(initialRefreshedAt));
	const refreshRequestedRef = useRef(false);
	const timeLabel = formatRelativeTime(lastRefreshedAt, now);
	const exactTimeLabel = lastRefreshedAt.toLocaleString();

	useEffect(() => {
		if (!isPending && refreshRequestedRef.current) {
			setLastRefreshedAt(new Date());
			refreshRequestedRef.current = false;
		}
	}, [isPending]);

	useEffect(() => {
		const timer = setInterval(() => {
			setNow(new Date());
		}, 30000);

		return () => {
			clearInterval(timer);
		};
	}, []);

	const handleRefresh = () => {
		refreshRequestedRef.current = true;
		startTransition(() => {
			router.refresh();
		});
	};

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			{role !== "tenant" && (
				<AddInspectionModal>
					<Button>
						<Plus className="mr-2 size-4" />
						Schedule Inspection
					</Button>
				</AddInspectionModal>
			)}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							onClick={handleRefresh}
							disabled={isPending}
						>
							<RefreshCw
								className={cn("size-4", isPending && "animate-spin")}
							/>
							<span className="ml-2 text-xs text-muted-foreground">
								{isPending ? "Refreshing..." : `Updated ${timeLabel}`}
							</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent sideOffset={6}>
						Last refreshed: {exactTimeLabel}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
