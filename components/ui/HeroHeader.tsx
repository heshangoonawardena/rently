"use client";
import menu2 from "react-useanimations/lib/menu2";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ChevronRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";
import UseAnimations from "react-useanimations";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Spinner } from "./spinner";

const menuItems = [
	{ name: "Features", href: "#features" },
	{ name: "Solution", href: "#" },
	{ name: "FAQ", href: "#faq" },
	{ name: "About", href: "/" },
];

export const HeroHeader = () => {
	const [menuState, setMenuState] = React.useState(false);
	const [isScrolled, setIsScrolled] = React.useState(false);
	const { isSignedIn, isLoaded } = useUser();

	React.useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);
	return (
		<header>
			<nav
				data-state={menuState && "active"}
				className="fixed z-20 w-full px-2"
			>
				<div
					className={cn(
						"mx-auto mt-4 max-w-5xl shadow-lg px-6 border transition-all duration-300 lg:px-3 rounded-md lg:rounded-full bg-background/50 backdrop-blur-2xl",
						isScrolled && "max-w-3xl  lg:px-3"
					)}
				>
					<div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-2">
						{/* Logo */}
						<div className="flex w-full justify-between lg:w-auto">
							<Link
								href="/"
								aria-label="home"
								className="flex items-center space-x-2"
							>
								<Logo />
							</Link>

							{/* <button
								onClick={() => setMenuState(!menuState)}
								aria-label={menuState == true ? "Close Menu" : "Open Menu"}
								className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
							>
								<Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
								<X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
							</button> */}
							<div className="lg:hidden relative z-20 cursor-pointer -m-2.5 -mr-4 block">
								<UseAnimations
									speed={1}
									animation={menu2}
									strokeColor="currentColor"
									size={36}
									onClick={() => setMenuState(!menuState)}
									aria-label="Toggle menu"
								/>
							</div>
						</div>

						{/* Links */}
						<div className="absolute inset-0 m-auto hidden size-fit lg:block">
							<ul className="flex gap-8 text-sm">
								{menuItems.map((item, index) => (
									<li key={index}>
										<Link
											href={item.href}
											className="text-muted-foreground hover:text-accent-foreground block duration-150"
										>
											<span>{item.name}</span>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Buttons */}
						<div className="bg-background/50 in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
							<div className="lg:hidden">
								<ul className="space-y-6 text-base">
									{menuItems.map((item, index) => (
										<li key={index}>
											<Link
												href={item.href}
												className="text-muted-foreground hover:text-accent-foreground block duration-150"
											>
												<span>{item.name}</span>
											</Link>
										</li>
									))}
								</ul>
							</div>
							<div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
								{!isLoaded ? (
									<Spinner className="size-8" />
								) : isSignedIn ? (
									<Button size="sm">
										<Link href="/dashboard" className="flex items-center gap-2">
											<span>Dashboard</span>
											<ChevronRightCircle />
										</Link>
									</Button>
								) : (
									<>
										<SignInButton mode="modal">
											<Button
												variant="outline"
												size="sm"
												className={cn(isScrolled && "lg:hidden")}
											>
												Login
											</Button>
										</SignInButton>

										<SignUpButton>
											<Button
												size="sm"
												className={cn(isScrolled && "lg:hidden")}
											>
												Sign Up
											</Button>
										</SignUpButton>

										<SignUpButton>
											<Button
												size="sm"
												className={cn(
													"hidden",
													isScrolled ? "lg:inline-flex" : "hidden"
												)}
											>
												Get Started
											</Button>
										</SignUpButton>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
};
