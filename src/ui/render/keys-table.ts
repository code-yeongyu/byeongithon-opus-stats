/**
 * 키별 사용량 테이블 (정렬 + share 막대).
 */

import { rankByMetric } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatPercent, formatUsd, maskKeyName } from "../../lib/format.ts";
import type { DashboardData, KeyRow } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";

type Col = Readonly<{
	header: string;
	align?: "right";
	cell: (row: KeyRow, totalTokens: number) => HTMLElement;
}>;

const successRatio = (row: KeyRow): number => (row.requests === 0 ? 1 : row.successes / row.requests);

const shareCell = (row: KeyRow, totalTokens: number): HTMLElement => {
	const ratio = totalTokens === 0 ? 0 : row.total_tokens / totalTokens;
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
		header: "키 이름",
		cell: (r) => el("td", null, el("span", { class: "key-pill" }, maskKeyName(r.key_name))),
	},
	{
		header: "요청",
		align: "right",
		cell: (r) => el("td", { "data-align": "right" }, formatNumber(r.requests)),
	},
	{
		header: "성공률",
		align: "right",
		cell: (r) => el("td", { "data-align": "right" }, formatPercent(successRatio(r))),
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

const renderRow = (row: KeyRow, totalTokens: number): HTMLTableRowElement => {
	const tr = el("tr") as HTMLTableRowElement;
	for (const col of COLUMNS) tr.appendChild(col.cell(row, totalTokens));
	return tr;
};

export const renderKeysTable = (data: DashboardData): void => {
	const root = document.querySelector('[data-component="keys-table"]');
	if (root === null) return;
	clearNode(root);

	const ranked = rankByMetric(data.keys, "total_tokens");
	const totalTokens = data.total.total_tokens;

	const thead = el("thead", null, renderHeader());
	const tbody = el("tbody");
	for (const entry of ranked) tbody.appendChild(renderRow(entry.item, totalTokens));

	const table = el("table", { class: "data-table", "aria-label": "키별 사용량" }, thead, tbody);
	root.appendChild(el("div", { class: "table-scroll" }, table));
};
