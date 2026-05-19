import { z } from "zod";

const intish = z.union([z.number(), z.string().transform((s) => Number(s))]).pipe(z.number().int().nonnegative());
const floatish = z.union([z.number(), z.string().transform((s) => Number(s))]).pipe(z.number().nonnegative());

const baseMetricFields = {
	requests: intish,
	successes: intish,
	errors: intish,
	input_tokens: intish,
	output_tokens: intish,
	cache_creation_input_tokens: intish,
	cache_read_input_tokens: intish,
	thinking_tokens: intish,
	total_tokens: intish,
	cost_usd: floatish,
};

export const TotalRowSchema = z.object({ scope: z.literal("overall"), ...baseMetricFields }).readonly();
export const KeyRowSchema = z.object({ key_name: z.string().min(1), ...baseMetricFields }).readonly();
export const ModelRowSchema = z.object({ model: z.string().min(1), ...baseMetricFields }).readonly();
export const HourlyRowSchema = z
	.object({
		hour_bucket: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
		...baseMetricFields,
	})
	.readonly();

export type TotalRow = z.infer<typeof TotalRowSchema>;
export type KeyRow = z.infer<typeof KeyRowSchema>;
export type ModelRow = z.infer<typeof ModelRowSchema>;
export type HourlyRow = z.infer<typeof HourlyRowSchema>;

export type MetricKey = keyof typeof baseMetricFields;

export const METRIC_KEYS = [
	"requests",
	"successes",
	"errors",
	"input_tokens",
	"output_tokens",
	"cache_creation_input_tokens",
	"cache_read_input_tokens",
	"thinking_tokens",
	"total_tokens",
	"cost_usd",
] as const satisfies readonly MetricKey[];

export interface DashboardData {
	readonly total: TotalRow;
	readonly keys: readonly KeyRow[];
	readonly models: readonly ModelRow[];
	readonly hourly: readonly HourlyRow[];
}

export const CUTOFF_KST = "2026-05-19T16:00:00+09:00" as const;
export const SITE_NAME = "변기톤 오푸스 통계" as const;
