"use client";

import { Card, CardContent } from "@/components/ui/card";

export type KpiSegment = {
	label: string;
	value: number;
	color: string;
	description?: string;
};

export type KpiCardData = {
	title: string;
	value: string;
	subtitle?: string;
	segments?: KpiSegment[];
	/**
	 * Override how a segment's right-hand label is rendered.
	 * Default renders the segment's share of the total as a percentage.
	 * Pass a custom formatter when segments don't represent a proportion
	 * (e.g. "12d until expiry" instead of "34%").
	 */
	formatSegmentValue?: (segment: KpiSegment, pct: number) => string;
	/**
	 * Set to false when segments don't represent parts of one meaningful
	 * whole (e.g. days-until-expiry for unrelated leases). The label row
	 * still renders; only the proportional bar is suppressed. Defaults
	 * to true.
	 */
	showProgressBar?: boolean;
};

export type KpiCardsProps = {
	cards: KpiCardData[];
	/** Override the grid's column classes per use case. */
	className?: string;
};

/** Returns 0 instead of NaN/Infinity when total is 0 or inputs are bad. */
function safePct(part: number, total: number): number {
	if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
		return 0;
	}
	return Number(((part / total) * 100).toFixed(1));
}

/**
 * Generic KPI card grid. Pass it data, it renders the cards — nothing in
 * here knows about oRPC, occupancy, rent, or any specific domain. Build a
 * `KpiCardData[]` wherever your data lives (a query hook, a server
 * component, a test fixture) and hand it to this component.
 */
export function KpiCard({ cards }: KpiCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => {
				const total = (card.segments ?? []).reduce(
					(sum, s) => sum + s.value,
					0,
				);

				return (
					<Card key={card.title} className="p-4">
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">{card.title}</p>

							<div className="text-3xl font-bold">{card.value}</div>

							{card.segments && card.segments.length > 0 && (
								<>
									<div className="flex justify-between text-xs">
										{card.segments.map((segment) => {
											const pct = safePct(segment.value, total);
											return (
												<div
													key={segment.label}
													className="text-center"
													style={{ color: segment.color }}
												>
													<div className="text-muted-foreground">
														{segment.label}
													</div>
													{segment.description && (
														<div className="text-[10px] text-muted-foreground">
															{segment.description}
														</div>
													)}
													<div className="font-medium">
														{card.formatSegmentValue
															? card.formatSegmentValue(segment, pct)
															: `${pct}%`}
													</div>
												</div>
											);
										})}
									</div>

									{(card.showProgressBar ?? true) && (
										<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
											{card.segments.map((segment) => (
												<div
													key={segment.label}
													style={{
														width: `${safePct(segment.value, total)}%`,
														backgroundColor: segment.color,
													}}
												/>
											))}
										</div>
									)}
								</>
							)}

							{card.subtitle && (
								<p className="text-xs text-muted-foreground">{card.subtitle}</p>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
