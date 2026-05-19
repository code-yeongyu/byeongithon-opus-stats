/**
 * Korean-locale formatting helpers. Pure functions, side-effect-free.
 */

const koInteger = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const koUsd = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const koPercent = new Intl.NumberFormat("ko-KR", { style: "percent", maximumFractionDigits: 2 });
const enHour = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Asia/Seoul",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

export function formatNumber(value: number): string {
	return koInteger.format(value);
}

export function formatUsd(value: number): string {
	return koUsd.format(value);
}

export function formatPercent(ratio: number): string {
	return koPercent.format(ratio);
}

export function abbreviateTokens(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1_000_000_000) {
		return `${(value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
	}
	if (abs >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
	}
	if (abs >= 1_000) {
		return `${(value / 1_000).toFixed(1).replace(/\.?0+$/, "")}K`;
	}
	return value.toString();
}

/**
 * Convert a "YYYY-MM-DD HH:MM:SS" UTC bucket string into a KST display string.
 */
export function hourBucketToKstLabel(bucket: string): string {
	const isoUtc = `${bucket.replace(" ", "T")}Z`;
	const date = new Date(isoUtc);
	if (Number.isNaN(date.getTime())) return bucket;
	const parts = enHour.formatToParts(date);
	const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
	return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} KST`;
}

/**
 * Convert a "YYYY-MM-DD HH:MM:SS" UTC bucket string into milliseconds since epoch.
 */
export function hourBucketToEpochMs(bucket: string): number {
	const isoUtc = `${bucket.replace(" ", "T")}Z`;
	const t = Date.parse(isoUtc);
	return Number.isNaN(t) ? 0 : t;
}

export function maskKeyName(keyName: string): string {
	// Already meaningfully anonymized; just shorten "sk-markers-" prefix for display.
	return keyName.replace(/^sk-markers-/, "").replace(/-key$/, "");
}

export function formatBytesPerToken(_bytesGuess = 4): (tokens: number) => string {
	const factor = _bytesGuess;
	return (tokens: number) => {
		const bytes = tokens * factor;
		if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
		if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
		if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
		return `${bytes} B`;
	};
}

/** Abbreviate USD for tight UI slots, e.g. $4,176.45 → "$4.18K". */
export function abbreviateUsd(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
	if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
	return `$${value.toFixed(2)}`;
}
