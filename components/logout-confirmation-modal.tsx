"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

export function LogoutConfirmationModal({
	children,
}: {
	children?: React.ReactNode;
}) {
	const [open, setOpen] = React.useState(false);

	const router = useRouter();

	const handleLogout = async () => {
		await authClient.signOut();
		router.replace("/login");
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start" variant="ghost" size="sm">
						<LogOut className="mr-2 size-4" />
						Log out
					</Button>
				)}
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Log out?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to log out of your account?
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>

					<AlertDialogAction variant="destructive" onClick={handleLogout}>
						<LogOut className="mr-2 size-4" />
						Log out
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
