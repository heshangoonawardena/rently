export interface ExportRow {
	[key: string]: string | number | null | undefined;
}

export interface PdfExportOptions {
	filename: string;
	title: string;
	generatedAt?: Date;

	summary?: {
		metric: string;
		value: string;
	}[];

	headers: string[];

	rows: (string | number | null | undefined)[][];

	filters?: string;
}
