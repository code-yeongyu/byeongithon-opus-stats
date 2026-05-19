/**
 * 키별 사용량 테이블 — 인터랙티브 (메트릭 스위처 + 키 필터 반응).
 *
 * - 상태(metric)에 따라 정렬 + 비중 막대 다른 메트릭으로 표시
 * - 비선택 키는 흐리게 표시 (완전히 숨기지 않아 비교 가능)
 */

import { rankByMetric, successRate } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatPercent, formatUsd, maskKeyName } from "../../lib/format.ts";
import type { DashboardData, KeyRow, MetricKey } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";
import type { DashState, DashStore } from "../state.ts";

const formatMetric = (row: KeyRow, metric: MetricKey): string => {
	if (metric === "cost_usd") return formatUsd(row.cost_usd);
	if (metric === "requests" || metric === "errors" || metric === "successes") return formatNumber(row[metric]);
	return abbreviateTokens(row[metric]);
};

const columnLabel = (metric: MetricKey): string => {
	if (metric === "requests") return "요청";
	if (metric === "cost_usd") return "비용";
	if (metric === "cache_read_input_tokens") return "캐시 읽기";
	if (metric === "total_tokens") return "총 토큰";
	return metric;
};

const shareCell = (row: KeyRow, metric: MetricKey, total: number): HTMLElement => {
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
	return el("td", null, ...children);
};

const renderHeader = (state: DashState): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	const labels = ["키", "요청", "성공률", `선택 메트릭 (${columnLabel(state.metric)})`, "전체 비중"];
	for (const label of labels) tr.appendChild(el("th", { scope: "col" }, label));
	return tr;
};

const renderRow = (row: KeyRow, state: DashState, total: number): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	if (!state.selectedKeys.has(row.key_name as string)) tr.classList.add("is-faded");
	tr.appendChild(el("td", null, el("span", { class: "key-pill" }, maskKeyName(row.key_name))));
	tr.appendChild(el("td", null, formatNumber(row.requests)));
	tr.appendChild(el("td", null, formatPercent(successRate(row))));
	tr.appendChild(el("td", { class: "is-emphasized" }, formatMetric(row, state.metric)));
	tr.appendChild(shareCell(row, state.metric, total));
	return tr;
};

const computeTotal = (rows: readonly KeyRow[], metric: MetricKey): number =>
	rows.reduce((acc, r) => acc + r[metric], 0);

export const renderKeysTable = (store: DashStore, data: DashboardData): void => {
	const root = document.querySelector('[data-component="keys-table"]');
	if (root === null) return;

	const draw = (state: DashState): void => {
		clearNode(root);
		const ranked = rankByMetric(data.keys, state.metric);
		const total = computeTotal(data.keys, state.metric);
		const thead = el("thead", null, renderHeader(state));
		const tbody = el("tbody");
		for (const entry of ranked) tbody.appendChild(renderRow(entry.item, state, total));
		root.appendChild(el("table", { class: "data-table", "aria-label": "키별 사용량" }, thead, tbody));
	};

	store.subscribe(draw);
};
