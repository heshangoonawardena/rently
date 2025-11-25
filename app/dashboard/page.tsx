"use client";
import { Button } from "@/components/ui/button";
import { deleteUser, signOut } from "@/server/users";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const dashboard = () => {
	const router = useRouter();

	return (
		<div className="min-h-screen w-full flex flex-col justify-center items-center gap-2">
			<h1>Dashboard</h1>
			<Button
				variant="default"
				onClick={() => {
					signOut();
					router.replace("/");
				}}
			>
				Sign out
			</Button>
			<Button
				variant="outline"
				onClick={() => {
					deleteUser();
					router.replace("/");
				}}
			>
				Delete User
			</Button>

			{/* <Button
				variant="outline"
				onClick={() => {
					toast.success(
						`Account created successfully Please verify your email before signing in`
					);
				}}
			>
				Test sonner
			</Button> */}
		</div>
	);
};

export default dashboard;
