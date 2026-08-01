"use client";

import { ChevronDown, Download, FileText, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ExportButtonsProps {
	onCsv: () => void;
	onPdf: () => void;
	csvLabel?: string;
	pdfLabel?: string;
	disabled?: boolean;
	className?: string;
}

export function ExportButtons({
	onCsv,
	onPdf,
	csvLabel = "CSV",
	pdfLabel = "PDF",
	disabled = false,
	className,
}: ExportButtonsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled}
					className={cn("gap-2", className)}
				>
					<Download className="size-4" />
					Export
					<ChevronDown className="size-4 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="min-w-40">
				<DropdownMenuItem onClick={onCsv}>
					<Sheet className="size-4" />
					{csvLabel}
				</DropdownMenuItem>

				<DropdownMenuItem onClick={onPdf}>
					<FileText className="size-4" />
					{pdfLabel}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
