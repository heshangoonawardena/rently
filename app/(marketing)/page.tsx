"use client";
import { FAQSection } from "@/app/(marketing)/_components/faq";
import FeaturesSection from "@/app/(marketing)/_components/features";
import Hero from "@/app/(marketing)/_components/hero";
import { StickyFooter } from "@/components/stickyfooter";
import { HeroHeader } from "@/components/ui/HeroHeader";

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
