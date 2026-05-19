/**
 * 모델별 사용량 테이블 (비용 기준 정렬 + 비중 막대).
 */

import { rankByMetric } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatPercent, formatUsd } from "../../lib/format.ts";
import type { DashboardData, ModelRow } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";

type Col = Readonly<{
	header: string;
	align?: "right";
	cell: (row: ModelRow, totalCost: number) => HTMLElement;
}>;

const shareCell = (row: ModelRow, totalCost: number): HTMLElement => {
	const ratio = totalCost === 0 ? 0 : row.cost_usd / totalCost;
	const pct = Math.max(0, Math.min(1, ratio));
	const bar = el(
		"span",
		{ class: "share-bar", "aria-hidden": "true" },
		el("span", { style: `width: ${(pct * 100).toFixed(2)}%` }),
	);
	return el("td", { "data-align": "right" }, formatPercent(ratio), " ", bar);
};

const COLUMNS: readonly Col[] = [
	{
		header: "모델",
		cell: (r) => el("td", null, el("code", null, r.model)),
	},
	{
		header: "요청",
		align: "right",
		cell: (r) => el("td", { "data-align": "right" }, formatNumber(r.requests)),
	},
	{
		header: "총 토큰",
		align: "right",
		cell: (r) => el("td", { "data-align": "right" }, abbreviateTokens(r.total_tokens)),
	},
	{
		header: "비용",
		align: "right",
		cell: (r) => el("td", { "data-align": "right" }, formatUsd(r.cost_usd)),
	},
	{ header: "비중", align: "right", cell: shareCell },
];

const renderHeader = (): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	for (const col of COLUMNS) {
		tr.appendChild(el("th", { scope: "col", "data-align": col.align ?? "left" }, col.header));
	}
	return tr;
};

const renderRow = (row: ModelRow, totalCost: number): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	for (const col of COLUMNS) tr.appendChild(col.cell(row, totalCost));
	return tr;
};

export const renderModelsTable = (data: DashboardData): void => {
	const root = document.querySelector('[data-component="models-table"]');
	if (root === null) return;
	clearNode(root);

	const ranked = rankByMetric(data.models, "cost_usd");
	const totalCost = data.total.cost_usd;

	const thead = el("thead", null, renderHeader());
	const tbody = el("tbody");
	for (const entry of ranked) tbody.appendChild(renderRow(entry.item, totalCost));

	const table = el("table", { class: "data-table", "aria-label": "모델별 사용량" }, thead, tbody);
	root.appendChild(el("div", { class: "table-scroll" }, table));
};
