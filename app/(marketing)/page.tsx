"use client";
import { FAQSection } from "@/app/(marketing)/_components/faq";
import FeaturesSection from "@/app/(marketing)/_components/features";
import { HeroHeader } from "@/app/(marketing)/_components/HeroHeader";
import Hero from "@/app/(marketing)/_components/hero";
import { StickyFooter } from "@/app/(marketing)/_components/stickyfooter";

export default function Home() {
	return (
		<div className="min-h-screen w-full relative">
			{/* New Header */}
			<HeroHeader />

			{/* Hero Section */}
			<Hero />

			{/* Features Section */}
			<FeaturesSection />

			{/* FAQSection  */}
			<FAQSection />

			{/* Sticky Footer */}
			<StickyFooter />
		</div>
	);
}
