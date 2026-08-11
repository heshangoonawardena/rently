import { ArrowDown, ArrowUp, SquareArrowOutUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stats = [
	{
		title: "Occupancy Rate",
		value: 82,
		delta: 8,
		lastMonth: 90,
		positive: true,
		prefix: "",
		suffix: "%",
	},
	{
		title: "Rent Collected",
		value: 190000,
		delta: -2.0,
		lastMonth: 2002098,
		positive: false,
		prefix: "",
		suffix: "",
	},
	{
		title: "Tenants in arrears",
		value: 4,
		delta: 0.4,
		// lastMonth: 0,
		positive: true,
		prefix: "",
		suffix: "",
	},
	{
		title: "Open repairs",
		value: 7,
		delta: 3.7,
		lastMonth: 46480,
		positive: true,
		prefix: "",
		suffix: "",
	},
];

function formatNumber(n: number) {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return n.toLocaleString();
	return n.toString();
}

export function MetricsOverview() {
	return (
		<div className="mx-auto grid grow grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat, i) => (
				<Card key={i} className="shadow-md">
					<CardHeader>
						<CardTitle className="text-muted-foreground text-sm font-medium">
							{stat.title}
						</CardTitle>
						<CardAction>
							<Button variant="ghost" size="sm">
								<SquareArrowOutUpRightIcon />
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="flex items-center gap-2.5 space-y-2.5">
						<span className="text-foreground text-2xl font-bold tracking-tight">
							{stat.prefix + formatNumber(stat.value) + stat.suffix}
						</span>
						<Badge
							variant="outline"
							className={cn({
								"text-green-500": stat.positive,
								"text-destructive": !stat.positive,
							})}
						>
							{stat.delta > 0 ? <ArrowUp /> : <ArrowDown />}
							{stat.delta}%
						</Badge>
					</CardContent>
					{stat?.lastMonth && (
						<CardFooter className="text-muted-foreground border-t text-xs">
							Vs last month:{" "}
							<span className="text-foreground font-medium">
								{stat.prefix + formatNumber(stat?.lastMonth) + stat.suffix}
							</span>
						</CardFooter>
					)}
				</Card>
			))}
		</div>
	);
}
