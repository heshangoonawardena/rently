"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../../components/ui/badge";
import BackgroundBlur from "./background-blur";

export function FAQSection() {
	const [openItems, setOpenItems] = useState<number[]>([]);

	const toggleItem = (index: number) => {
		setOpenItems((prev) =>
			prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
		);
	};

	const faqs = [
		{
			question: "🏡 What is Rently?",
			answer:
				"Rently is a modern, web-based property management platform that helps landlords, property managers, and tenants manage rentals digitally. From leases and rent payments to maintenance requests and inspections, everything is in one place.",
		},
		{
			question: "📱 Do I need a computer to use Rently?",
			answer:
				"No! Rently is fully responsive and works seamlessly on desktops, tablets, and smartphones, so you can manage your properties anytime, anywhere.",
		},
		{
			question: "🌍 Can I access Rently from anywhere?",
			answer:
				"Yes! As long as you have an internet connection, you can securely access Rently from anywhere in the world.",
		},
		{
			question: "👥 Who is Rently designed for?",
			answer:
				"Rently is built for landlords, property managers, and tenants. Each user has a personalized dashboard with features and permissions tailored to their role.",
		},
		{
			question: "🚀 How do I get started?",
			answer:
				"Getting started is easy! Click the Get Started or Sign Up button, create your account, and you'll be ready to manage your properties in just a few minutes.",
		},
		{
			question: "🔒 Is my data secure?",
			answer:
				"Absolutely. Rently is designed with security in mind to help keep your account and property data safe and protected.",
		},
		{
			question: "💳 Can tenants view their rent payments?",
			answer:
				"Yes! Tenants can view their rent payment history directly from their dashboard. Payments appear automatically once they have been recorded by the landlord or property manager.",
		},
		{
			question: "🛠️ Can tenants report maintenance issues?",
			answer:
				"Yes. Tenants can submit maintenance requests, and track the progress of repairs directly from their dashboard.",
		},
	];

	return (
		<section id="faq" className="relative overflow-hidden pb-120 pt-24">
			{/* Background blur effects */}
			<BackgroundBlur />

			<div className="z-10 container mx-auto px-4">
				<motion.div
					className="flex justify-center"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					viewport={{ once: true }}
				>
					<Badge variant={"outline"}>
						<Sparkles />
						Faqs
					</Badge>
				</motion.div>

				<motion.h2
					className="mx-auto mt-6 max-w-xl text-center text-4xl font-medium md:text-[54px] md:leading-15"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					viewport={{ once: true }}
				>
					Questions? We've got <span className="text-primary">answers</span>
				</motion.h2>

				<div className="mx-auto mt-12 flex max-w-xl flex-col gap-6">
					{faqs.map((faq, index) => (
						<motion.div
							key={index}
							className="from-secondary/40 to-secondary/10 rounded-2xl border border-white/10 bg-linear-to-b p-6 shadow-[0px_2px_0px_0px_rgba(255,255,255,0.1)_inset] transition-all duration-300 hover:border-white/20 "
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							viewport={{ once: true }}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => toggleItem(index)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleItem(index);
								}
							}}
							{...(index === faqs.length - 1 && { "data-faq": faq.question })}
						>
							<div className="flex items-start justify-between">
								<h3 className="m-0 font-medium pr-4">{faq.question}</h3>
								<motion.div
									animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
									transition={{ duration: 0.3, ease: "easeInOut" }}
									className=""
								>
									{openItems.includes(index) ? (
										<Minus
											className="text-primary shrink-0 transition duration-300"
											size={24}
										/>
									) : (
										<Plus
											className="text-primary shrink-0 transition duration-300"
											size={24}
										/>
									)}
								</motion.div>
							</div>
							<AnimatePresence>
								{openItems.includes(index) && (
									<motion.div
										className="mt-4 text-muted-foreground leading-relaxed overflow-hidden"
										initial={{ opacity: 0, height: 0, marginTop: 0 }}
										animate={{ opacity: 1, height: "auto", marginTop: 16 }}
										exit={{ opacity: 0, height: 0, marginTop: 0 }}
										transition={{
											duration: 0.4,
											ease: "easeInOut",
											opacity: { duration: 0.2 },
										}}
									>
										{faq.answer}
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
