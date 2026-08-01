import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getServerRole, getServerSession } from "@/lib/get-server";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const role = await getServerRole();
	const session = await getServerSession();

	// const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
	// const { config } = useSidebarConfig();
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "16rem",
					"--sidebar-width-icon": "3rem",
					"--header-height": "calc(var(--spacing) * 14)",
				} as React.CSSProperties
			}
			// className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
		>
			<AppSidebar
				variant="inset"
				collapsible="icon"
				side="left"
				role={role}
				user={session?.user}
			/>
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							{children}
						</div>
					</div>
				</div>
				{/* <SiteFooter /> */}
			</SidebarInset>

			{/* Theme Customizer */}
			{/* <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
			<ThemeCustomizer
				open={themeCustomizerOpen}
				onOpenChange={setThemeCustomizerOpen}
			/> */}
			{/* <UpgradeToProButton /> */}
		</SidebarProvider>
	);
}
