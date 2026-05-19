/**
 * 총괄 KPI 카드 그리드 — 키 필터에 따라 합계를 재계산한다.
 * 비용 카드는 abbreviateUsd로 축약 (오버플로우 방지), hint에 전체 값을 표기.
 */

import { successRate } from "../../lib/aggregate.ts";
import { abbreviateTokens, abbreviateUsd, formatNumber, formatPercent, formatUsd } from "../../lib/format.ts";
import type { DashboardData, KeyRow, TotalRow } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";
import type { DashState, DashStore } from "../state.ts";

type StatCard = Readonly<{
	label: string;
	value: string;
	hint?: string;
	emphasis?: boolean;
}>;

const aggregateSelected = (data: DashboardData, state: DashState): TotalRow => {
	const selected: readonly KeyRow[] = data.keys.filter((k) => state.selectedKeys.has(k.key_name as string));
	if (selected.length === data.keys.length) return data.total;
	const sum = {
		requests: 0,
		errors: 0,
		successes: 0,
		input_tokens: 0,
		output_tokens: 0,
		cache_creation_input_tokens: 0,
		cache_read_input_tokens: 0,
		thinking_tokens: 0,
		total_tokens: 0,
		cost_usd: 0,
	};
	for (const k of selected) {
		sum.requests += k.requests;
		sum.errors += k.errors;
		sum.successes += k.successes;
		sum.input_tokens += k.input_tokens;
		sum.output_tokens += k.output_tokens;
		sum.cache_creation_input_tokens += k.cache_creation_input_tokens;
		sum.cache_read_input_tokens += k.cache_read_input_tokens;
		sum.thinking_tokens += k.thinking_tokens;
		sum.total_tokens += k.total_tokens;
		sum.cost_usd += k.cost_usd;
	}
	return { scope: "overall", ...sum } as const;
};

const buildCards = (data: DashboardData, t: TotalRow, isFiltered: boolean): readonly StatCard[] => {
	const opusCost = data.models.find((m) => (m.model as string) === "claude-opus-4-7")?.cost_usd ?? 0;
	const opusShare = data.total.cost_usd > 0 ? opusCost / data.total.cost_usd : 0;
	const filterSuffix = isFiltered ? " · 선택" : "";
	return [
		{
			label: `총 요청${filterSuffix}`,
			value: formatNumber(t.requests),
			hint: `성공 ${formatNumber(t.successes)} · 실패 ${formatNumber(t.errors)}`,
			emphasis: true,
		},
		{
			label: `총 토큰${filterSuffix}`,
			value: abbreviateTokens(t.total_tokens),
			hint: `${formatNumber(t.total_tokens)} 합산`,
			emphasis: true,
		},
		{
			label: `비용${filterSuffix}`,
			value: abbreviateUsd(t.cost_usd),
			hint: `${formatUsd(t.cost_usd)} · Opus 비중 ${formatPercent(opusShare)}`,
			emphasis: true,
		},
		{
			label: "성공률",
			value: formatPercent(successRate(t)),
			hint: `${formatNumber(t.errors)}건 실패 / ${formatNumber(t.requests)}건`,
		},
		{
			label: "캐시 히트",
			value: abbreviateTokens(t.cache_read_input_tokens),
			hint: "cache_read · 비용 절감 핵심",
		},
		{
			label: "출력 토큰",
			value: abbreviateTokens(t.output_tokens),
			hint: "모델이 생성한 토큰",
		},
		{
			label: "캐시 생성",
			value: abbreviateTokens(t.cache_creation_input_tokens),
			hint: "프롬프트 캐싱 인덱싱",
		},
		{
			label: "키 개수",
			value: `${data.keys.length}개`,
			hint: "sk-markers-* 패턴",
		},
	];
};

const card = (spec: StatCard): HTMLElement => {
	const classes = spec.emphasis === true ? "stat-card stat-card--emphasis" : "stat-card";
	return el(
		"article",
		{ class: classes },
		el("div", { class: "stat-label" }, spec.label),
		el("div", { class: "stat-value" }, spec.value),
		spec.hint !== undefined ? el("div", { class: "stat-hint" }, spec.hint) : null,
	);
};

export const renderStats = (store: DashStore, data: DashboardData): void => {
	const root = document.querySelector('[data-component="stats-grid"]');
	if (root === null) return;
	const draw = (state: DashState): void => {
		clearNode(root);
		const filtered = aggregateSelected(data, state);
		const isFiltered = state.selectedKeys.size !== data.keys.length;
		for (const spec of buildCards(data, filtered, isFiltered)) root.appendChild(card(spec));
	};
	store.subscribe(draw);
};
