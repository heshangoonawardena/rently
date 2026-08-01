import { ResetPasswordForm } from "./_components/reset-password-form";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
	return (
		<div className="bg-neutral-100 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 dark:bg-neutral-800">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<Link
					href="/"
					className="flex items-center justify-between gap-2 self-center font-medium"
				>
					<Image src="/logo.svg" alt="Logo" width={30} height={30} priority />
					rently
				</Link>
				<ResetPasswordForm />
			</div>
		</div>
	);
}
