/**
 * 총괄 섹션 — 8개 통계 카드 렌더링.
 */

import { successRate } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatPercent, formatUsd } from "../../lib/format.ts";
import type { DashboardData } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";

type StatCard = Readonly<{
	label: string;
	value: string;
	hint?: string;
}>;

const buildCards = (data: DashboardData): readonly StatCard[] => {
	const t = data.total;
	const opusCost = data.models.find((m) => m.model === "claude-opus-4-7")?.cost_usd ?? 0;
	return [
		{
			label: "총 요청",
			value: formatNumber(t.requests),
			hint: `성공 ${formatNumber(t.successes)} · 실패 ${formatNumber(t.errors)}`,
		},
		{
			label: "총 토큰",
			value: abbreviateTokens(t.total_tokens),
			hint: `${formatNumber(t.total_tokens)} 합산`,
		},
		{
			label: "비용",
			value: formatUsd(t.cost_usd),
			hint: `Opus 4.7 비중 ${formatPercent(t.cost_usd > 0 ? opusCost / t.cost_usd : 0)}`,
		},
		{
			label: "성공률",
			value: formatPercent(successRate(t)),
			hint: `${formatNumber(t.errors)}건 실패 / ${formatNumber(t.requests)}건`,
		},
		{
			label: "캐시 히트",
			value: abbreviateTokens(t.cache_read_input_tokens),
			hint: "cache_read_input_tokens · 비용 절감의 핵심",
		},
		{
			label: "출력 토큰",
			value: abbreviateTokens(t.output_tokens),
			hint: "모델이 생성한 토큰",
		},
		{
			label: "캐시 생성",
			value: abbreviateTokens(t.cache_creation_input_tokens),
			hint: "프롬프트 캐싱 인덱싱 비용",
		},
		{
			label: "키 개수",
			value: `${data.keys.length}개`,
			hint: "sk-markers-* 패턴",
		},
	];
};

const renderCard = (spec: StatCard): HTMLElement =>
	el(
		"article",
		{ class: "stat-card" },
		el("div", { class: "stat-label" }, spec.label),
		el("div", { class: "stat-value" }, spec.value),
		spec.hint !== undefined ? el("div", { class: "stat-hint" }, spec.hint) : null,
	);

export const renderStats = (data: DashboardData): void => {
	const root = document.querySelector('[data-component="stats-grid"]');
	if (root === null) return;
	clearNode(root);
	for (const spec of buildCards(data)) root.appendChild(renderCard(spec));
};
