import { parseCsvToObjects } from "./csv.ts";
import {
	type DashboardData,
	type HourlyRow,
	HourlyRowSchema,
	type KeyRow,
	KeyRowSchema,
	type ModelRow,
	ModelRowSchema,
	type TotalRow,
	TotalRowSchema,
} from "./types.ts";

export class DataLoadError extends Error {
	public override readonly name = "DataLoadError";
	public readonly source: string;
	public override readonly cause?: unknown;
	constructor(source: string, message: string, cause?: unknown) {
		super(`[${source}] ${message}`);
		this.source = source;
		if (cause !== undefined) this.cause = cause;
	}
}

export interface LoadSources {
	readonly total: string;
	readonly keys: string;
	readonly models: string;
	readonly hourly: string;
}

export type CsvFetcher = (path: string) => Promise<string>;

export const defaultFetcher: CsvFetcher = async (path) => {
	const res = await fetch(path, { cache: "force-cache" });
	if (!res.ok) throw new DataLoadError(path, `HTTP ${res.status}`);
	return res.text();
};

export function parseTotalCsv(text: string): TotalRow {
	const objs = parseCsvToObjects(text);
	if (objs.length === 0) throw new DataLoadError("total.csv", "empty CSV");
	const first = objs[0];
	if (!first) throw new DataLoadError("total.csv", "no rows after header");
	const parsed = TotalRowSchema.safeParse(first);
	if (!parsed.success) throw new DataLoadError("total.csv", parsed.error.message);
	return parsed.data;
}

export function parseKeyCsv(text: string): readonly KeyRow[] {
	return parseCsvToObjects(text).map((obj, idx) => {
		const parsed = KeyRowSchema.safeParse(obj);
		if (!parsed.success) throw new DataLoadError("key_breakdown.csv", `row ${idx}: ${parsed.error.message}`);
		return parsed.data;
	});
}

export function parseModelCsv(text: string): readonly ModelRow[] {
	return parseCsvToObjects(text).map((obj, idx) => {
		const parsed = ModelRowSchema.safeParse(obj);
		if (!parsed.success) throw new DataLoadError("model_breakdown.csv", `row ${idx}: ${parsed.error.message}`);
		return parsed.data;
	});
}

export function parseHourlyCsv(text: string): readonly HourlyRow[] {
	return parseCsvToObjects(text).map((obj, idx) => {
		const parsed = HourlyRowSchema.safeParse(obj);
		if (!parsed.success) throw new DataLoadError("hourly.csv", `row ${idx}: ${parsed.error.message}`);
		return parsed.data;
	});
}

export async function loadDashboardData(
	sources: LoadSources,
	fetcher: CsvFetcher = defaultFetcher,
): Promise<DashboardData> {
	const [totalText, keyText, modelText, hourlyText] = await Promise.all([
		fetcher(sources.total),
		fetcher(sources.keys),
		fetcher(sources.models),
		fetcher(sources.hourly),
	]);

	return {
		total: parseTotalCsv(totalText),
		keys: parseKeyCsv(keyText),
		models: parseModelCsv(modelText),
		hourly: parseHourlyCsv(hourlyText),
	};
}

export const DEFAULT_SOURCES: LoadSources = {
	total: "/data/total.csv",
	keys: "/data/key_breakdown.csv",
	models: "/data/model_breakdown.csv",
	hourly: "/data/hourly.csv",
} as const;
