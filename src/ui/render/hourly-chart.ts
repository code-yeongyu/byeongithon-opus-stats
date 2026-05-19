/**
 * 시간별 SVG 라인 차트 — 인터랙티브 + 라운드 틱.
 *
 * - 메트릭 변경 시 다시 그린다
 * - y축 ticks는 nice round numbers (1·2·2.5·5의 배수)
 * - x축은 KST 시각
 * - 점에 hover 시 툴팁
 */

import { maxByMetric } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatUsd, hourBucketToKstLabel } from "../../lib/format.ts";
import type { DashboardData, HourlyRow, MetricKey } from "../../lib/types.ts";
import { clearNode, el, svgEl } from "../dom.ts";
import type { DashState, DashStore } from "../state.ts";

const W = 800;
const H = 320;
const PAD = { top: 24, right: 24, bottom: 56, left: 72 } as const;

const xScale = (i: number, n: number): number => {
	if (n <= 1) return PAD.left;
	return PAD.left + (i / (n - 1)) * (W - PAD.left - PAD.right);
};
const yScale = (v: number, max: number): number => {
	const h = H - PAD.top - PAD.bottom;
	return max <= 0 ? H - PAD.bottom : H - PAD.bottom - (v / max) * h;
};

/** Compute up to ~5 nice round-number ticks. */
const niceTicks = (rawMax: number): { ticks: readonly number[]; niceMax: number } => {
	if (rawMax <= 0) return { ticks: [0], niceMax: 0 };
	const log = Math.log10(rawMax);
	const pow = 10 ** Math.floor(log);
	const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
	const target = rawMax / 4;
	let step = pow;
	for (const c of candidates) if (Math.abs(c - target) < Math.abs(step - target)) step = c;
	const niceMax = Math.ceil(rawMax / step) * step;
	const ticks: number[] = [];
	for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(v);
	return { ticks, niceMax };
};

const formatTick = (v: number, metric: MetricKey): string => {
	if (metric === "cost_usd") return v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`;
	if (metric === "requests" || metric === "errors" || metric === "successes") {
		if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
		return v.toFixed(0);
	}
	return abbreviateTokens(v);
};

const formatTooltip = (row: HourlyRow, metric: MetricKey): string => {
	if (metric === "cost_usd") return formatUsd(row.cost_usd);
	if (metric === "requests") return `${formatNumber(row.requests)}건`;
	return abbreviateTokens(row[metric]);
};

const drawGrid = (svg: SVGElement, ticks: readonly number[], niceMax: number, metric: MetricKey): void => {
	for (const v of ticks) {
		const y = yScale(v, niceMax);
		svg.appendChild(svgEl("line", { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, class: "chart-grid" }));
		svg.appendChild(
			svgEl("text", { x: PAD.left - 8, y: y + 4, "text-anchor": "end", class: "chart-axis" }, formatTick(v, metric)),
		);
	}
};

const drawXLabels = (svg: SVGElement, rows: readonly HourlyRow[]): void => {
	const step = Math.max(1, Math.ceil(rows.length / 8));
	const lastIdx = rows.length - 1;
	rows.forEach((row, i) => {
		if (i % step !== 0 && i !== lastIdx) return;
		const fullLabel = hourBucketToKstLabel(row.hour_bucket).replace(" KST", "");
		const tail = fullLabel.split(" ")[1] ?? fullLabel;
		const x = xScale(i, rows.length);
		const y = H - PAD.bottom + 18;
		const anchor = i === 0 ? "start" : i === lastIdx ? "end" : "middle";
		svg.appendChild(svgEl("text", { x, y, "text-anchor": anchor, class: "chart-axis" }, tail));
	});
};

const buildLinePath = (points: readonly { x: number; y: number }[]): string =>
	points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

const buildAreaPath = (points: readonly { x: number; y: number }[]): string => {
	if (points.length === 0) return "";
	const top = buildLinePath(points);
	const first = points[0];
	const last = points[points.length - 1];
	if (first === undefined || last === undefined) return "";
	const baseY = H - PAD.bottom;
	return `${top} L${last.x.toFixed(2)},${baseY} L${first.x.toFixed(2)},${baseY} Z`;
};

const renderSvg = (data: DashboardData, metric: MetricKey): SVGElement => {
	const rows = data.hourly;
	const rawMax = maxByMetric(rows, metric)?.[metric] ?? 1;
	const { ticks, niceMax } = niceTicks(rawMax);
	const points = rows.map((r, i) => ({ x: xScale(i, rows.length), y: yScale(r[metric], niceMax) }));

	const svg = svgEl("svg", {
		viewBox: `0 0 ${W} ${H}`,
		role: "img",
		"aria-label": `시간대별 ${metric}`,
		preserveAspectRatio: "xMidYMid meet",
	});

	const defs = svgEl("defs");
	const grad = svgEl("linearGradient", { id: "chartFill", x1: "0", y1: "0", x2: "0", y2: "1" });
	grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": "#14b8a6", "stop-opacity": "0.5" }));
	grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": "#14b8a6", "stop-opacity": "0" }));
	defs.appendChild(grad);
	svg.appendChild(defs);

	drawGrid(svg, ticks, niceMax, metric);
	svg.appendChild(svgEl("path", { d: buildAreaPath(points), class: "chart-area" }));
	svg.appendChild(svgEl("path", { d: buildLinePath(points), class: "chart-line" }));

	rows.forEach((row, i) => {
		const p = points[i];
		if (!p) return;
		const circle = svgEl("circle", { cx: p.x, cy: p.y, r: "5", class: "chart-dot" });
		circle.appendChild(
			svgEl("title", null, `${hourBucketToKstLabel(row.hour_bucket)} · ${formatTooltip(row, metric)}`),
		);
		svg.appendChild(circle);
	});

	drawXLabels(svg, rows);
	return svg;
};

export const renderHourlyChart = (store: DashStore, data: DashboardData): void => {
	const root = document.querySelector('[data-component="hourly-chart"]');
	if (root === null) return;

	const draw = (state: DashState): void => {
		clearNode(root);
		if (data.hourly.length === 0) {
			root.appendChild(el("p", { class: "stat-loading" }, "시간별 데이터가 비어있어요."));
			return;
		}
		root.appendChild(renderSvg(data, state.metric));
		const peak = maxByMetric(data.hourly, state.metric);
		const note =
			peak === null
				? "24개 버킷(UTC)"
				: `24개 버킷(UTC) · 피크 ${hourBucketToKstLabel(peak.hour_bucket)} · ${formatTooltip(peak, state.metric)}`;
		root.appendChild(el("p", { class: "chart-note" }, note));
	};

	store.subscribe(draw);
};
