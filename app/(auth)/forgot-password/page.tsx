import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/_components/forgot-password-form";

export default function LoginPage() {
	return (
		<div className="bg-neutral-100 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 ">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<Link
					href="/"
					className="flex items-center justify-between gap-2 self-center font-medium"
				>
					<Image src="/logo.svg" alt="Logo" width={30} height={30} priority />
					rently
				</Link>
				<ForgotPasswordForm />
			</div>
		</div>
	);
}
