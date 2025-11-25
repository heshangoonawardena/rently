import { GalleryVerticalEnd, House } from "lucide-react"

import { SignupForm } from "./_components/signup-form"

export default function SignupPage() {
  return (
    <div className="bg-neutral-100 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 dark:bg-neutral-800">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-neutral-900 text-neutral-50 flex size-6 items-center justify-center rounded-md dark:bg-neutral-50 dark:text-neutral-900">
            <House className="size-4" />
          </div>
          rently
        </a>
        <SignupForm />
      </div>
    </div>
  )
}
