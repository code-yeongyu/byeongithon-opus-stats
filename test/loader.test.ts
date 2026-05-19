import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	DataLoadError,
	DEFAULT_SOURCES,
	loadDashboardData,
	parseHourlyCsv,
	parseKeyCsv,
	parseModelCsv,
	parseTotalCsv,
} from "../src/lib/loader.ts";

const DATA_DIR = resolve(__dirname, "..", "data");
const readData = (name: string): string => readFileSync(resolve(DATA_DIR, name), "utf-8");

describe("parseTotalCsv", () => {
	it("parses the real total.csv into one TotalRow", () => {
		const row = parseTotalCsv(readData("total.csv"));
		expect(row.scope).toBe("overall");
		expect(row.requests).toBe(14067);
		expect(row.successes).toBe(14042);
		expect(row.errors).toBe(25);
		expect(row.total_tokens).toBe(4385134301);
		expect(row.cost_usd).toBeCloseTo(4176.448991, 5);
	});

	it("throws DataLoadError on empty CSV", () => {
		expect(() => parseTotalCsv("scope,requests\n")).toThrow(DataLoadError);
	});

	it("throws on bad scope value", () => {
		expect(() =>
			parseTotalCsv(
				'"scope","requests","successes","errors","input_tokens","output_tokens","cache_creation_input_tokens","cache_read_input_tokens","thinking_tokens","total_tokens","cost_usd"\n"daily",1,1,0,1,1,0,0,0,2,0\n',
			),
		).toThrow(DataLoadError);
	});
});

describe("parseKeyCsv", () => {
	it("parses all 6 sk-markers keys", () => {
		const rows = parseKeyCsv(readData("key_breakdown.csv"));
		expect(rows).toHaveLength(6);
		const names = rows.map((r) => r.key_name);
		expect(names).toContain("sk-markers-nebula-key");
		expect(names).toContain("sk-markers-apex-key");
	});

	it("returns rows whose request sum matches total", () => {
		const rows = parseKeyCsv(readData("key_breakdown.csv"));
		const sum = rows.reduce((a, r) => a + r.requests, 0);
		expect(sum).toBe(14067);
	});
});

describe("parseModelCsv", () => {
	it("parses all 6 models including zero-usage ones", () => {
		const rows = parseModelCsv(readData("model_breakdown.csv"));
		expect(rows).toHaveLength(6);
		const opus = rows.find((r) => r.model === "claude-opus-4-7");
		expect(opus).toBeDefined();
		expect(opus?.cost_usd).toBeCloseTo(4144.472967, 4);
	});
});

describe("parseHourlyCsv", () => {
	it("parses 24 hourly buckets covering 2026-05-18 UTC", () => {
		const rows = parseHourlyCsv(readData("hourly.csv"));
		expect(rows).toHaveLength(24);
		expect(rows[0]?.hour_bucket).toBe("2026-05-18 00:00:00");
		expect(rows[23]?.hour_bucket).toBe("2026-05-18 23:00:00");
	});
});

describe("loadDashboardData", () => {
	it("loads all four CSVs via a custom fetcher", async () => {
		const fetcher = async (path: string): Promise<string> => {
			const file =
				path === DEFAULT_SOURCES.total
					? "total.csv"
					: path === DEFAULT_SOURCES.keys
						? "key_breakdown.csv"
						: path === DEFAULT_SOURCES.models
							? "model_breakdown.csv"
							: "hourly.csv";
			return readData(file);
		};
		const data = await loadDashboardData(DEFAULT_SOURCES, fetcher);
		expect(data.total.requests).toBe(14067);
		expect(data.keys).toHaveLength(6);
		expect(data.models).toHaveLength(6);
		expect(data.hourly).toHaveLength(24);
	});
});
