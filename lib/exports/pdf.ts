import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { PdfExportOptions } from "./types";

export function exportPdf(options: PdfExportOptions) {
	const doc = new jsPDF({
		unit: "pt",
		format: "a4",
	});

	const withTable = doc as jsPDF & {
		lastAutoTable?: {
			finalY?: number;
		};
	};

	doc.setFontSize(18);
	doc.text(options.title, 40, 45);
	doc.setFontSize(10);
	doc.text(
		`Generated: ${(options.generatedAt ?? new Date()).toLocaleString()}`,
		40,
		62,
	);

	if (options.filters) {
		doc.text(options.filters, 40, 78);
	}

	if (options.summary?.length) {
		autoTable(doc, {
			startY: 92,
			theme: "grid",
			head: [["Metric", "Value"]],
			body: options.summary.map((item) => [item.metric, item.value]),
			headStyles: {
				fillColor: [20, 28, 45],
			},
		});
	}

	autoTable(doc, {
		startY: (withTable.lastAutoTable?.finalY ?? 90) + 20,
		theme: "striped",
		head: [options.headers],
		body: options.rows.map((row) => row.map((cell) => cell ?? "")),
		headStyles: {
			fillColor: [20, 28, 45],
			textColor: 255,
		},
		styles: {
			fontSize: 9,
			cellPadding: 6,
		},
		alternateRowStyles: {
			fillColor: [245, 245, 245],
		},
	});

	const pages = doc.getNumberOfPages();

	for (let i = 1; i <= pages; i++) {
		doc.setPage(i);
		doc.setFontSize(9);
		doc.text(
			`Page ${i} of ${pages}`,
			doc.internal.pageSize.width - 80,
			doc.internal.pageSize.height - 20,
		);
	}

	doc.save(`${options.filename}-${new Date().toISOString().split("T")[0]}.pdf`);
}
