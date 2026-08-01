"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AddRepairRequestModal } from "./add-repair-modal";

export default function QuickActions() {
	return (
		<div className="flex items-center space-x-2">
			<AddRepairRequestModal />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="cursor-pointer">
						<Settings className="size-4 mr-2" />
						Actions
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem className="cursor-pointer">
						<Settings className="size-4 mr-2" />
						Reapir Settings
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
