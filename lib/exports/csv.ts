import Papa from "papaparse";
import type { ExportRow } from "./types";

export function exportCsv(filename: string, rows: ExportRow[]) {
	const csv = Papa.unparse(rows, {
		header: true,
		quotes: true,
	});

	const blob = new Blob([csv], {
		type: "text/csv;charset=utf-8",
	});

	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");

	link.href = url;

	link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;

	link.click();

	URL.revokeObjectURL(url);
}
