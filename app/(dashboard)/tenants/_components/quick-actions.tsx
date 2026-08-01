"use client";

import { Plus, Settings, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTenantModal } from "./add-tenant-modal";

export default function QuickActions() {
	return (
		<div className="flex items-center space-x-2">
			<AddTenantModal />
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
						Tenant Settings
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
