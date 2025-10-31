"use client";
import { FAQSection } from "@/components/home/faq";
import FeaturesSection from "@/components/home/features";
import Features from "@/components/home/old-features";
import Hero from "@/components/home/hero";
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
			{/* <Features /> */}
			<FeaturesSection/>

			{/* FAQSection  */}
			<FAQSection />

			{/* Sticky Footer */}
			<StickyFooter />
		</div>
	);
}
