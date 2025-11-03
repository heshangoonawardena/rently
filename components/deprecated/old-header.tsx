"use client";


import menu4 from "react-useanimations/lib/menu4";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import UseAnimations from "react-useanimations";
import { ModeToggle } from "../mode-toggle";
import Image from "next/image";

const OldHeader = () => {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 100);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleMobileNavClick = (elementId: string) => {
		setIsMobileMenuOpen(false);
		setTimeout(() => {
			const element = document.getElementById(elementId);
			if (element) {
				const headerOffset = 120; // Account for sticky header height + margin
				const elementPosition =
					element.getBoundingClientRect().top + window.pageYOffset;
				const offsetPosition = elementPosition - headerOffset;

				window.scrollTo({
					top: offsetPosition,
					behavior: "smooth",
				});
			}
		}, 100);
	};

	return (
		<>
			{/* Desktop Header */}
			{/* TODO: remove login when isScrolled */}
			<header
				className={`sticky top-4 z-[9999] mx-auto hidden w-full flex-row items-center justify-between self-start rounded-full bg-background/80 md:flex backdrop-blur-sm border  shadow-lg transition-all duration-300 ${
					isScrolled ? "max-w-3xl px-2" : "max-w-5xl px-4"
				} py-2`}
				style={{
					willChange: "transform",
					transform: "translateZ(0)",
					backfaceVisibility: "hidden",
					perspective: "1000px",
				}}
			>
				<a
					className={`z-50 flex items-center justify-center gap-2 transition-all duration-300 ${
						isScrolled ? "ml-4" : ""
					}`}
					href="https://github.com/heshangoonawardena/"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Image
						className="rounded-full"
						src="https://placehold.co/32x32/black/white"
						alt="Logo"
						width={32}
						height={32}
					/>
				</a>

				<div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-muted-foreground transition duration-200 hover:text-foreground md:flex md:space-x-2">
					<Button
						variant={"ghost"}
						onClick={(e) => {
							e.preventDefault();
							const element = document.getElementById("features");
							if (element) {
								const headerOffset = 120; // Account for sticky header height + margin
								const elementPosition =
									element.getBoundingClientRect().top + window.pageYOffset;
								const offsetPosition = elementPosition - headerOffset;

								window.scrollTo({
									top: offsetPosition,
									behavior: "smooth",
								});
							}
						}}
					>
						<span className="relative z-20">Features</span>
					</Button>
					<Button
						variant={"ghost"}
						onClick={(e) => {
							e.preventDefault();
							const element = document.getElementById("features");
							if (element) {
								const headerOffset = 120; // Account for sticky header height + margin
								const elementPosition =
									element.getBoundingClientRect().top + window.pageYOffset;
								const offsetPosition = elementPosition - headerOffset;

								window.scrollTo({
									top: offsetPosition,
									behavior: "smooth",
								});
							}
						}}
					>
						<span className="relative z-20">features*</span>
					</Button>
					<Button
						variant={"ghost"}
						onClick={(e) => {
							e.preventDefault();
							const element = document.getElementById("faq");
							if (element) {
								const headerOffset = 120; // Account for sticky header height + margin
								const elementPosition =
									element.getBoundingClientRect().top + window.pageYOffset;
								const offsetPosition = elementPosition - headerOffset;

								window.scrollTo({
									top: offsetPosition,
									behavior: "smooth",
								});
							}
						}}
					>
						<span className="relative z-20">FAQ</span>
					</Button>
				</div>

				<div className="flex items-center gap-4">
					<ModeToggle />
					<Button variant={"outline"}>Log In</Button>

					<Button>Sign Up</Button>
				</div>
			</header>

			{/* Mobile Header */}
			<header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg md:hidden px-4 py-3">
				<a
					className="flex items-center justify-center gap-2 rounded-full"
					href="https://v0.app"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Image
						className="rounded-full"
						src="https://placehold.co/32x32/black/white"
						alt="Logo"
						width={28}
						height={28}
					/>
				</a>
				<div className="flex space-x-4 items-center justify-center">
					<ModeToggle />

					<Button variant={"outline"} size={"icon-lg"}>
						<UseAnimations
							speed={1.5}
							animation={menu4}
							strokeColor="currentColor"
							size={36}
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							aria-label="Toggle menu"
						/>
					</Button>
				</div>
			</header>

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm md:hidden">
					<div className="absolute top-25 left-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-6">
						<nav className="flex flex-col space-y-4">
							<Button
								variant={"ghost"}
								size={"lg"}
								onClick={() => handleMobileNavClick("features")}
							>
								Features
							</Button>
							<Button
								variant={"ghost"}
								size={"lg"}
								onClick={() => handleMobileNavClick("features")}
							>
								features*
							</Button>
							<Button
								variant={"ghost"}
								size={"lg"}
								onClick={() => handleMobileNavClick("faq")}
							>
								FAQ
							</Button>

							<Separator />

							<div className="flex flex-col space-y-3">
								<Button variant={"outline"} size={"lg"}>
									Log In
								</Button>
								<Button size={"lg"}>Sign Up</Button>
							</div>
						</nav>
					</div>
				</div>
			)}
		</>
	);
};

export default OldHeader;
