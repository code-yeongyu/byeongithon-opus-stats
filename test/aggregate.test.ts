import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cumulativeSeries, maxByMetric, rankByMetric, successRate, validateDataset } from "../src/lib/aggregate.ts";
import { parseHourlyCsv, parseKeyCsv, parseModelCsv, parseTotalCsv } from "../src/lib/loader.ts";
import type { DashboardData } from "../src/lib/types.ts";

const DATA_DIR = resolve(__dirname, "..", "data");
const read = (name: string): string => readFileSync(resolve(DATA_DIR, name), "utf-8");

const data: DashboardData = {
	total: parseTotalCsv(read("total.csv")),
	keys: parseKeyCsv(read("key_breakdown.csv")),
	models: parseModelCsv(read("model_breakdown.csv")),
	hourly: parseHourlyCsv(read("hourly.csv")),
};

describe("rankByMetric", () => {
	it("ranks keys by total_tokens descending", () => {
		const ranked = rankByMetric(data.keys, "total_tokens");
		expect(ranked[0]?.item.key_name).toBe("sk-markers-nebula-key");
		expect(ranked[0]?.rank).toBe(1);
		expect(ranked[5]?.item.key_name).toBe("sk-markers-apex-key");
		expect(ranked[0]?.shareOfTotal).toBeGreaterThan(0.3);
	});
	it("shares sum to ~1", () => {
		const ranked = rankByMetric(data.keys, "total_tokens");
		const sum = ranked.reduce((a, r) => a + r.shareOfTotal, 0);
		expect(sum).toBeCloseTo(1, 6);
	});
});

describe("successRate", () => {
	it("returns 1 for zero requests", () => {
		expect(successRate({ requests: 0, successes: 0 })).toBe(1);
	});
	it("computes a normal success rate", () => {
		expect(successRate({ requests: 100, successes: 95 })).toBeCloseTo(0.95, 6);
	});
});

describe("cumulativeSeries", () => {
	it("produces strictly non-decreasing cumulative values", () => {
		const series = cumulativeSeries(data.hourly, "requests");
		expect(series).toHaveLength(24);
		for (let i = 1; i < series.length; i += 1) {
			const cur = series[i];
			const prev = series[i - 1];
			expect(cur && prev && cur.cumulative >= prev.cumulative).toBe(true);
		}
	});
});

describe("maxByMetric", () => {
	it("returns the peak hour for requests", () => {
		const peak = maxByMetric(data.hourly, "requests");
		expect(peak?.hour_bucket).toBe("2026-05-18 12:00:00");
		expect(peak?.requests).toBe(1193);
	});
	it("returns null for empty input", () => {
		expect(maxByMetric([], "requests")).toBeNull();
	});
});

describe("validateDataset", () => {
	it("confirms keys and models sum to total requests", () => {
		const report = validateDataset(data);
		expect(report.totalRequests).toBe(14067);
		expect(report.keysMatchTotal).toBe(true);
		expect(report.modelsMatchTotal).toBe(true);
	});
});
