import type { DashboardData, HourlyRow, KeyRow, MetricKey, ModelRow } from "./types.ts";
import { METRIC_KEYS } from "./types.ts";

export interface RankEntry<T> {
	readonly item: T;
	readonly rank: number;
	readonly shareOfTotal: number;
}

export function rankByMetric<T extends KeyRow | ModelRow>(
	rows: readonly T[],
	metric: MetricKey,
): readonly RankEntry<T>[] {
	const total = rows.reduce((acc, r) => acc + r[metric], 0);
	const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
	return sorted.map((item, idx) => ({
		item,
		rank: idx + 1,
		shareOfTotal: total === 0 ? 0 : item[metric] / total,
	}));
}

export function successRate<T extends { requests: number; successes: number }>(row: T): number {
	if (row.requests === 0) return 1;
	return row.successes / row.requests;
}

export interface CumulativePoint {
	readonly hour_bucket: string;
	readonly value: number;
	readonly cumulative: number;
}

export function cumulativeSeries(hourly: readonly HourlyRow[], metric: MetricKey): readonly CumulativePoint[] {
	let cum = 0;
	return hourly.map((row) => {
		cum += row[metric];
		return { hour_bucket: row.hour_bucket, value: row[metric], cumulative: cum };
	});
}

export function maxByMetric<T extends HourlyRow | KeyRow | ModelRow>(rows: readonly T[], metric: MetricKey): T | null {
	if (rows.length === 0) return null;
	return rows.reduce((best, r) => (best === null || r[metric] > best[metric] ? r : best), rows[0] ?? null);
}

export interface ValidationReport {
	readonly totalRequests: number;
	readonly summedKeyRequests: number;
	readonly summedModelRequests: number;
	readonly summedHourlyRequests: number;
	readonly keysMatchTotal: boolean;
	readonly modelsMatchTotal: boolean;
	readonly hourlyCoversCutoff: boolean;
}

export function validateDataset(data: DashboardData): ValidationReport {
	const summedKey = data.keys.reduce((a, r) => a + r.requests, 0);
	const summedModel = data.models.reduce((a, r) => a + r.requests, 0);
	const summedHourly = data.hourly.reduce((a, r) => a + r.requests, 0);
	return {
		totalRequests: data.total.requests,
		summedKeyRequests: summedKey,
		summedModelRequests: summedModel,
		summedHourlyRequests: summedHourly,
		keysMatchTotal: summedKey === data.total.requests,
		modelsMatchTotal: summedModel === data.total.requests,
		hourlyCoversCutoff: summedHourly > 0,
	};
}

export function totalsFromKeys(keys: readonly KeyRow[]): Record<MetricKey, number> {
	const out: Record<MetricKey, number> = Object.create(null);
	for (const k of METRIC_KEYS) out[k] = 0;
	for (const row of keys) {
		for (const k of METRIC_KEYS) out[k] += row[k];
	}
	return out;
}

export function pickTopN<T>(entries: readonly RankEntry<T>[], n: number): readonly RankEntry<T>[] {
	if (n <= 0) return [];
	return entries.slice(0, Math.min(n, entries.length));
}
