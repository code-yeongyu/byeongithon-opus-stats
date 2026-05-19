/**
 * Minimal RFC 4180 CSV parser.
 * - Handles quoted fields with embedded commas, quotes, and newlines.
 * - Returns rows as plain string[][] arrays. No header parsing.
 * - Designed for trusted, well-formed input (the data export pipeline).
 */
export function parseCsv(text: string): readonly (readonly string[])[] {
	const rows: string[][] = [];
	let cur: string[] = [];
	let field = "";
	let inQuotes = false;
	let i = 0;
	const n = text.length;

	const pushField = (): void => {
		cur.push(field);
		field = "";
	};
	const pushRow = (): void => {
		// Skip blank trailing lines but keep rows with at least one column populated.
		if (cur.length > 1 || (cur.length === 1 && cur[0] !== "")) rows.push(cur);
		cur = [];
	};

	while (i < n) {
		const ch = text.charCodeAt(i);
		if (inQuotes) {
			if (ch === 34 /* '"' */) {
				if (i + 1 < n && text.charCodeAt(i + 1) === 34) {
					field += '"';
					i += 2;
				} else {
					inQuotes = false;
					i += 1;
				}
			} else {
				field += text[i];
				i += 1;
			}
			continue;
		}

		if (ch === 34) {
			inQuotes = true;
			i += 1;
		} else if (ch === 44 /* ',' */) {
			pushField();
			i += 1;
		} else if (ch === 13 /* '\r' */) {
			pushField();
			pushRow();
			i += 1;
			if (i < n && text.charCodeAt(i) === 10) i += 1;
		} else if (ch === 10 /* '\n' */) {
			pushField();
			pushRow();
			i += 1;
		} else {
			field += text[i];
			i += 1;
		}
	}

	// Flush trailing field/row.
	if (field.length > 0 || cur.length > 0) {
		pushField();
		pushRow();
	}

	return rows;
}

/**
 * Convert array-of-arrays into array-of-records using the first row as header.
 */
export function csvToObjects(rows: readonly (readonly string[])[]): readonly Readonly<Record<string, string>>[] {
	if (rows.length < 2) return [];
	const header = rows[0];
	if (!header) return [];
	return rows.slice(1).map((row) => {
		const obj: Record<string, string> = {};
		for (let i = 0; i < header.length; i += 1) {
			const key = header[i];
			if (key === undefined) continue;
			obj[key] = row[i] ?? "";
		}
		return obj;
	});
}

/**
 * One-shot helper: parse CSV text and return header-keyed records.
 */
export function parseCsvToObjects(text: string): readonly Readonly<Record<string, string>>[] {
	return csvToObjects(parseCsv(text));
}
