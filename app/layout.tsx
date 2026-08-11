import "@/lib/orpc.server"; // for pre-rendering
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
	title: "Rently",
	description: "A rent management dashboard for tenants",
};

const inter = localFont({
	src: "./fonts/Inter-VariableFont.ttf",
	display: "swap",
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" data-scroll-behavior="smooth">
			<body className={inter.className}>
				<ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
					<SidebarConfigProvider>
						<Providers>{children}</Providers>
					</SidebarConfigProvider>
				</ThemeProvider>
				<Toaster position="top-right" />
			</body>
		</html>
	);
}
