import { SignupForm } from "./_components/signup-form";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 dark:bg-neutral-800">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<Link
					href="/"
					className="flex items-center justify-between gap-2 self-center font-medium"
				>
					<Image src="/logo.svg" alt="Logo" width={30} height={30} priority />
					rently
				</Link>
				<SignupForm />
			</div>
		</div>
	);
}
