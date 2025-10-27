import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center uppercase justify-center rounded-full border border-primary/40 px-4 py-2 text-sm font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-2 cursor-default [&>svg]:pointer-events-none focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 transition-[color,box-shadow] overflow-hidden dark:border-primary dark:focus-visible:border-primary dark:focus-visible:ring-primary/50 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-background [a&]:hover:bg-primary/90 dark:bg-primary dark:text-background dark:[a&]:hover:bg-primary/90",
				secondary:
					"border-transparent bg-primary text-background [a&]:hover:bg-primary/90 dark:bg-primary dark:text-background dark:[a&]:hover:bg-primary/90",
				destructive:
					"border-transparent bg-red-500 text-white [a&]:hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500/60 dark:bg-red-900 dark:[a&]:hover:bg-red-900/90 dark:focus-visible:ring-red-900/20 dark:dark:focus-visible:ring-red-900/40 dark:dark:bg-red-900/60",
				outline:
					"text-primary [a&]:hover:bg-primary [a&]:hover:text-primary dark:text-primary dark:[a&]:hover:bg-primary dark:[a&]:hover:text-primary",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
