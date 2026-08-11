"use client";

import {
	Building,
	Handshake,
	LayoutDashboard,
	ListCheck,
	ReceiptText,
	Settings,
	UserCog,
	Users,
	Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
	user?: {
		name?: string | null;
		email?: string | null;
	};
	role: Role;
};

import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types/role";

export interface NavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	roles: Role[];
	items?: NavItem[];
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

export function AppSidebar({ user, role, ...props }: AppSidebarProps) {
	const navUser = {
		name: user?.name ?? "name",
		email: user?.email ?? "email",
		role,
	};

	const navGroups: NavGroup[] = [
		{
			label: "Overview",
			items: [
				{
					title: "Dashboard",
					url: "/dashboard",
					icon: LayoutDashboard,
					roles: ["manager", "owner"],
				},
			],
		},

		{
			label: "Manage",
			items: [
				{
					title: "Units",
					url: "/units",
					icon: Building,
					roles: ["manager", "owner"],
				},
				{
					title: "Tenants",
					url: "/tenants",
					icon: Users,
					roles: ["manager", "owner"],
				},
				{
					title: "Leases",
					url: "/leases",
					icon: Handshake,
					roles: ["manager", "owner", "tenant"],
				},
				{
					title: "Payments",
					url: "/payments",
					icon: ReceiptText,
					roles: ["manager", "owner", "tenant"],
				},
			],
		},

		{
			label: "Maintenance",
			items: [
				{
					title: "Repairs",
					url: "/repairs",
					icon: Wrench,
					roles: ["tenant", "manager", "owner"],
				},
				{
					title: "Inspections",
					url: "/inspections",
					icon: ListCheck,
					roles: ["manager", "owner", "tenant"],
				},
			],
		},

		{
			label: "Other",
			items: [
				// {
				// 	title: "Settings",
				// 	url: "#",
				// 	icon: Settings,
				// 	roles: ["tenant", "manager", "owner"],
				// 	items: [
				// 		{
				// 			title: "Notification Settings",
				// 			url: "/settings/notifications",
				// 			roles: ["tenant", "manager", "owner"],
				// 		},
				// 	],
				// },
				{
					title: "Users",
					url: "/users",
					icon: UserCog,
					roles: ["owner"],
				},
			],
		},
	];

	const filteredNavGroups = navGroups
		.map((group) => ({
			...group,
			items: group.items
				.filter((item) => item.roles.includes(role))
				.map((item) => ({
					...item,
					items: item.items?.filter((subItem) => subItem.roles.includes(role)),
				})),
		}))
		.filter((group) => group.items.length > 0);

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/dashboard">
								<Image
									src="/logo.svg"
									alt="Logo"
									width={30}
									height={30}
									priority
								/>

								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">rently</span>
									<span className="truncate text-xs">
										Property Management Dashboard
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{filteredNavGroups.map((group) => (
					<NavMain key={group.label} label={group.label} items={group.items} />
				))}
			</SidebarContent>
			<SidebarFooter>
				{/* <SidebarNotification /> */}
				<NavUser user={navUser} />
			</SidebarFooter>
		</Sidebar>
	);
}
