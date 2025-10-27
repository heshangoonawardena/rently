"use client";

import type React from "react";

import { useTheme } from "next-themes";
import { motion, useInView } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Features() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });
	const { theme } = useTheme();

	const [baseColor, setBaseColor] = useState<[number, number, number]>([
		0.906, 0.541, 0.325,
	]); // #e78a53 in RGB normalized
	const [glowColor, setGlowColor] = useState<[number, number, number]>([
		0.906, 0.541, 0.325,
	]); // #e78a53 in RGB normalized

	const [dark, setDark] = useState<number>(theme === "dark" ? 1 : 0);

	useEffect(() => {
		setBaseColor([0.906, 0.541, 0.325]); // #e78a53
		setGlowColor([0.906, 0.541, 0.325]); // #e78a53
		setDark(theme === "dark" ? 1 : 0);
	}, [theme]);

	return (
		<section
			id="features"
			className="text-foreground relative overflow-hidden py-12 sm:py-24 md:py-32"
		>
			{/* Horizontal bar */}
			<div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
			<div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>

			{/* Background blur effects */}
			<motion.div
				animate={{
					scale: [1, 1.5, 1],
					opacity: [0.4, 0.9, 0.4],
					transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
				}}
				className="bg-primary/60 absolute top-1/6 -right-20 z-[-1] h-72 w-72 rounded-full opacity-80 blur-3xl"
			></motion.div>
			<motion.div
				animate={{
					scale: [1, 1.5, 1],
					opacity: [0.4, 0.9, 0.4],
					transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
				}}
				className="bg-primary/60 absolute top-1/2 -left-20 z-[-1] h-64 w-64 rounded-full opacity-80 blur-3xl"
			></motion.div>

			<motion.div
				ref={ref}
				initial={{ opacity: 0, y: 50 }}
				animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
				transition={{ duration: 0.5, delay: 0 }}
				className="container mx-auto flex flex-col items-center gap-6 sm:gap-12"
			>
				<h2
					className={cn(
						"mb-8 text-foreground text-center text-4xl font-semibold tracking-tighter md:text-[54px] md:leading-[60px]"
					)}
				>
					Features
				</h2>
				<div className=" select-none">
					<div className="grid grid-cols-12 gap-4 justify-center">
						{/* Dynamic Layouts */}
						<motion.div
							className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-1"
							initial={{ opacity: 0, y: 50 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
							// transition={{ duration: 0.5, delay: 0.25 }}
							whileHover={{
								scale: 1.02,
								boxShadow: "0 20px 40px rgba(231, 138, 83, 0.3)",
								borderColor: "rgba(231, 138, 83, 0.6)",
							}}
							style={{ transition: "all 0s ease-in-out" }}
						>
							<div className="flex flex-col gap-4">
								<h3 className="text-2xl leading-none font-semibold tracking-tight">
									Dynamic Layouts
								</h3>
								<div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
									<p className="max-w-[460px]">
										Responsive layouts that transform and adapt seamlessly
										across all device sizes.
									</p>
								</div>
							</div>
							<div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
								<div className="relative w-full max-w-sm">
									<Image
										src="https://placehold.co/400x300"
										unoptimized
										alt="Dynamic Layout Example"
										className="w-full h-auto rounded-lg shadow-lg"
										width={400}
										height={300}
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
								</div>
							</div>
						</motion.div>

						{/* Dynamic Layouts */}
						<motion.div
							className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-7"
							initial={{ opacity: 0, y: 50 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
							// transition={{ duration: 0.5, delay: 0.25 }}
							whileHover={{
								scale: 1.02,
								boxShadow: "0 20px 40px rgba(231, 138, 83, 0.3)",
								borderColor: "rgba(231, 138, 83, 0.6)",
							}}
							style={{ transition: "all 0s ease-in-out" }}
						>
							<div className="flex flex-col gap-4">
								<h3 className="text-2xl leading-none font-semibold tracking-tight">
									Dynamic Layouts
								</h3>
								<div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
									<p className="max-w-[460px]">
										Responsive layouts that transform and adapt seamlessly
										across all device sizes.
									</p>
								</div>
							</div>
							<div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
								<div className="relative w-full max-w-sm">
									<Image
										src="https://placehold.co/400x300"
										unoptimized
										alt="Dynamic Layout Example"
										className="w-full h-auto rounded-lg shadow-lg"
										width={400}
										height={300}
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
								</div>
							</div>
						</motion.div>

						{/* Dynamic Layouts */}
						<motion.div
							className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-1"
							initial={{ opacity: 0, y: 50 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
							// transition={{ duration: 0.5, delay: 0.25 }}
							whileHover={{
								scale: 1.02,
								boxShadow: "0 20px 40px rgba(231, 138, 83, 0.3)",
								borderColor: "rgba(231, 138, 83, 0.6)",
							}}
							style={{ transition: "all 0s ease-in-out" }}
						>
							<div className="flex flex-col gap-4">
								<h3 className="text-2xl leading-none font-semibold tracking-tight">
									Dynamic Layouts
								</h3>
								<div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
									<p className="max-w-[460px]">
										Responsive layouts that transform and adapt seamlessly
										across all device sizes.
									</p>
								</div>
							</div>
							<div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
								<div className="relative w-full max-w-sm">
									<Image
										src="https://placehold.co/400x300"
										unoptimized
										alt="Dynamic Layout Example"
										className="w-full h-auto rounded-lg shadow-lg"
										width={400}
										height={300}
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
								</div>
							</div>
						</motion.div>

						{/* Dynamic Layouts */}
						<motion.div
							className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-7"
							initial={{ opacity: 0, y: 50 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
							// transition={{ duration: 0.5, delay: 0.25 }}
							whileHover={{
								scale: 1.02,
								boxShadow: "0 20px 40px rgba(231, 138, 83, 0.3)",
								borderColor: "rgba(231, 138, 83, 0.6)",
							}}
							style={{ transition: "all 0s ease-in-out" }}
						>
							<div className="flex flex-col gap-4">
								<h3 className="text-2xl leading-none font-semibold tracking-tight">
									Dynamic Layouts
								</h3>
								<div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
									<p className="max-w-[460px]">
										Responsive layouts that transform and adapt seamlessly
										across all device sizes.
									</p>
								</div>
							</div>
							<div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
								<div className="relative w-full max-w-sm">
									<Image
										src="https://placehold.co/400x300"
										unoptimized
										alt="Dynamic Layout Example"
										className="w-full h-auto rounded-lg shadow-lg"
										width={400}
										height={300}
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</motion.div>
		</section>
	);
}
