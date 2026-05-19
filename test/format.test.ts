import { describe, expect, it } from "vitest";
import {
	abbreviateTokens,
	formatNumber,
	formatPercent,
	formatUsd,
	hourBucketToEpochMs,
	hourBucketToKstLabel,
	maskKeyName,
} from "../src/lib/format.ts";

describe("formatNumber", () => {
	it("uses Korean thousand separators", () => {
		expect(formatNumber(14067)).toBe("14,067");
		expect(formatNumber(4385134301)).toBe("4,385,134,301");
	});
});

describe("formatUsd", () => {
	it("formats USD with two decimals", () => {
		expect(formatUsd(4176.448991)).toMatch(/4,?176\.45/);
	});
});

describe("formatPercent", () => {
	it("renders ratios as Korean percent", () => {
		expect(formatPercent(0.95)).toContain("95");
	});
});

describe("abbreviateTokens", () => {
	it("abbreviates billions, millions, thousands", () => {
		expect(abbreviateTokens(4_385_134_301)).toBe("4.39B");
		expect(abbreviateTokens(310_853_098)).toMatch(/^310\.\d{0,2}M$/);
		expect(abbreviateTokens(73_705)).toBe("73.7K");
		expect(abbreviateTokens(42)).toBe("42");
	});
});

describe("hourBucketToKstLabel", () => {
	it("shifts UTC bucket to KST and labels it", () => {
		expect(hourBucketToKstLabel("2026-05-18 12:00:00")).toBe("2026-05-18 21:00 KST");
		expect(hourBucketToKstLabel("2026-05-18 23:00:00")).toBe("2026-05-19 08:00 KST");
	});
	it("returns original for invalid input", () => {
		expect(hourBucketToKstLabel("not-a-date")).toBe("not-a-date");
	});
});

describe("hourBucketToEpochMs", () => {
	it("returns milliseconds for valid input", () => {
		expect(hourBucketToEpochMs("2026-05-18 00:00:00")).toBe(Date.UTC(2026, 4, 18));
	});
	it("returns 0 for invalid input", () => {
		expect(hourBucketToEpochMs("nope")).toBe(0);
	});
});

describe("maskKeyName", () => {
	it("strips sk-markers- prefix and -key suffix", () => {
		expect(maskKeyName("sk-markers-nebula-key")).toBe("nebula");
		expect(maskKeyName("sk-markers-aurora-key")).toBe("aurora");
		expect(maskKeyName("plain-name")).toBe("plain-name");
	});
});
