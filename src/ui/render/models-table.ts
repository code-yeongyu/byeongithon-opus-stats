/**
 * 모델별 사용량 테이블 — 인터랙티브 (메트릭 스위처 반영).
 *
 * - 선택 메트릭 기준 정렬 + 비중 막대
 * - 호출 0건 / 토큰 0개 모델은 노이즈로 제외하고 푸트노트로 안내
 */

import { rankByMetric } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatPercent, formatUsd } from "../../lib/format.ts";
import type { DashboardData, ModelRow } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";
import type { DashMetric, DashState, DashStore } from "../state.ts";

const COL_LABEL: Readonly<Record<DashMetric, string>> = {
	requests: "요청",
	total_tokens: "총 토큰",
	cost_usd: "비용",
	cache_read_input_tokens: "캐시 히트",
};

const formatMetric = (row: ModelRow, metric: DashMetric): string => {
	if (metric === "cost_usd") return formatUsd(row.cost_usd);
	if (metric === "requests") return formatNumber(row.requests);
	return abbreviateTokens(row[metric]);
};

const shareCell = (row: ModelRow, metric: DashMetric, total: number): HTMLElement => {
	const ratio = total === 0 ? 0 : row[metric] / total;
	const pct = Math.max(0, Math.min(1, ratio));
	const children: (HTMLElement | Text)[] = [document.createTextNode(formatPercent(ratio))];
	if (pct > 0.001) {
		children.push(
			document.createTextNode(" "),
			el(
				"span",
				{ class: "share-bar", "aria-hidden": "true" },
				el("span", { style: `width:${(pct * 100).toFixed(2)}%` }),
			),
		);
	}
	return el("td", { "data-align": "right" }, ...children);
};

const renderHeader = (metric: DashMetric): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	const headers = ["모델", "요청", "총 토큰", `메트릭 (${COL_LABEL[metric]})`, "비중"];
	for (let i = 0; i < headers.length; i++) {
		const text = headers[i];
		if (text === undefined) continue;
		tr.appendChild(el("th", { scope: "col", "data-align": i === 0 ? "left" : "right" }, text));
	}
	return tr;
};

const renderRow = (row: ModelRow, metric: DashMetric, total: number): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	tr.appendChild(el("td", null, el("code", null, row.model)));
	tr.appendChild(el("td", { "data-align": "right" }, formatNumber(row.requests)));
	tr.appendChild(el("td", { "data-align": "right" }, abbreviateTokens(row.total_tokens)));
	tr.appendChild(el("td", { "data-align": "right", class: "is-emphasized" }, formatMetric(row, metric)));
	tr.appendChild(shareCell(row, metric, total));
	return tr;
};

const computeTotal = (rows: readonly ModelRow[], metric: DashMetric): number =>
	rows.reduce((acc, r) => acc + r[metric], 0);

export const renderModelsTable = (store: DashStore, data: DashboardData): void => {
	const root = document.querySelector('[data-component="models-table"]');
	if (root === null) return;
	const draw = (state: DashState): void => {
		clearNode(root);
		const usedModels = data.models.filter((m) => m.requests > 0 && m.total_tokens > 0);
		const skipped = data.models.length - usedModels.length;
		const ranked = rankByMetric(usedModels, state.metric);
		const total = computeTotal(usedModels, state.metric);
		const thead = el("thead", null, renderHeader(state.metric));
		const tbody = el("tbody");
		for (const entry of ranked) tbody.appendChild(renderRow(entry.item, state.metric, total));
		const table = el("table", { class: "data-table", "aria-label": "모델별 사용량" }, thead, tbody);
		root.appendChild(table);
		if (skipped > 0) {
			root.appendChild(
				el(
					"p",
					{ class: "table-footnote" },
					`* 호출 0건 또는 토큰 0개인 모델 ${skipped}개는 노이즈라 표에서 제외했어요.`,
				),
			);
		}
	};
	store.subscribe(draw);
};
