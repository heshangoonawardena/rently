"use client";

import { EllipsisVertical, LogOut } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { LogoutConfirmationModal } from "./logout-confirmation-modal";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function NavUser({
		user,
	}: {
		user: {
			name: string;
			email: string;
			role?: string;
			avatar?: string;
		};
	}) {
		const { isMobile } = useSidebar();

		const initials = `${user.name[0] ?? ""}${user.name?.[1] ?? ""}`;

		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground "
							>
								<Avatar>
									<AvatarFallback className="text-lg font-semibold">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="text-muted-foreground truncate text-xs">
										{user.role}
									</span>
								</div>
								<EllipsisVertical className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar>
										<AvatarFallback className="text-lg font-semibold">
											{initials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{user.name}</span>
										<span className="text-muted-foreground truncate text-xs">
											{user.email}
										</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{/* <DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link href="/settings/notifications">
									<BellDot />
									Notifications
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup> */}
							{/* <DropdownMenuSeparator /> */}
							<LogoutConfirmationModal>
								<DropdownMenuItem
									onSelect={(e) => e.preventDefault()}
									className="text-destructive "
								>
									<LogOut className="mr-2 size-4 text-destructive" />
									Log out
								</DropdownMenuItem>
							</LogoutConfirmationModal>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}
