"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddInspectionModal } from "@/components/inspection-overview-card/add-inspection-modal";
import { Role } from "@/types/role";

type QuickActionsProps = {
	role: Role;
};

export default function QuickActions({ role }: QuickActionsProps) {
	return (
		<div className="flex items-center space-x-2">
			{role !== "tenant" && <AddInspectionModal />}
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
						Inspection Settings
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
