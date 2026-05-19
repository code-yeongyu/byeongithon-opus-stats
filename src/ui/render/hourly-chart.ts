/**
 * 시간별 SVG 라인 차트 (라이브러리 없이).
 *
 * x축: UTC bucket을 KST 시각으로 표시. y축: 요청 수.
 */

import { cumulativeSeries, maxByMetric } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, hourBucketToKstLabel } from "../../lib/format.ts";
import type { DashboardData, HourlyRow } from "../../lib/types.ts";
import { clearNode, el, svgEl } from "../dom.ts";

const WIDTH = 800;
const HEIGHT = 320;
const PADDING = { top: 24, right: 24, bottom: 56, left: 56 } as const;

const xScale = (i: number, total: number): number => {
	if (total <= 1) return PADDING.left;
	const innerW = WIDTH - PADDING.left - PADDING.right;
	return PADDING.left + (i / (total - 1)) * innerW;
};

const yScale = (value: number, max: number): number => {
	const innerH = HEIGHT - PADDING.top - PADDING.bottom;
	if (max <= 0) return HEIGHT - PADDING.bottom;
	return HEIGHT - PADDING.bottom - (value / max) * innerH;
};

const buildLinePath = (points: readonly { x: number; y: number }[]): string =>
	points.map((p, i) => `${(i === 0 ? "M" : "L") + p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

const buildAreaPath = (points: readonly { x: number; y: number }[]): string => {
	if (points.length === 0) return "";
	const top = buildLinePath(points);
	const first = points[0];
	const last = points[points.length - 1];
	if (first === undefined || last === undefined) return "";
	const base = HEIGHT - PADDING.bottom;
	const closure = ` L${last.x.toFixed(2)},${base} L${first.x.toFixed(2)},${base} Z`;
	return top + closure;
};

const drawGrid = (svg: SVGSVGElement, max: number): void => {
	const ticks = 4;
	for (let i = 0; i <= ticks; i += 1) {
		const v = (max * (ticks - i)) / ticks;
		const y = yScale(v, max);
		svg.appendChild(
			svgEl("line", {
				x1: PADDING.left,
				x2: WIDTH - PADDING.right,
				y1: y,
				y2: y,
				class: "chart-grid",
				stroke: "currentColor",
				"stroke-opacity": 0.15,
			}),
		);
		svg.appendChild(
			svgEl(
				"text",
				{ x: PADDING.left - 8, y: y + 4, "text-anchor": "end", class: "chart-axis" },
				abbreviateTokens(v),
			),
		);
	}
};

const drawXLabels = (svg: SVGSVGElement, rows: readonly HourlyRow[]): void => {
	const step = Math.max(1, Math.ceil(rows.length / 8));
	rows.forEach((row, i) => {
		if (i % step !== 0 && i !== rows.length - 1) return;
		const fullLabel = hourBucketToKstLabel(row.hour_bucket);
		const tail = fullLabel.replace(" KST", "").slice(11); // "HH:MM"
		const x = xScale(i, rows.length);
		const y = HEIGHT - PADDING.bottom + 18;
		svg.appendChild(svgEl("text", { x, y, "text-anchor": "middle", class: "chart-axis" }, tail));
	});
};

const buildDefs = (): SVGElement => {
	const defs = svgEl("defs");
	const grad = svgEl("linearGradient", { id: "chartFill", x1: "0", y1: "0", x2: "0", y2: "1" });
	grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": "#14b8a6", "stop-opacity": 0.5 }));
	grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": "#14b8a6", "stop-opacity": 0 }));
	defs.appendChild(grad);
	return defs;
};

export const renderHourlyChart = (data: DashboardData): void => {
	const root = document.querySelector('[data-component="hourly-chart"]');
	if (root === null) return;
	clearNode(root);

	if (data.hourly.length === 0) {
		root.appendChild(el("p", { class: "stat-loading" }, "시간별 데이터가 비어있어요."));
		return;
	}

	const maxRequests = maxByMetric(data.hourly, "requests")?.requests ?? 1;
	const points = data.hourly.map((row, i) => ({
		x: xScale(i, data.hourly.length),
		y: yScale(row.requests, maxRequests),
	}));

	const svg = svgEl("svg", {
		viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
		role: "img",
		"aria-label": "시간대별 요청 차트",
		preserveAspectRatio: "xMidYMid meet",
	}) as SVGSVGElement;

	svg.appendChild(buildDefs());
	drawGrid(svg, maxRequests);
	svg.appendChild(svgEl("path", { d: buildAreaPath(points), class: "chart-area" }));
	svg.appendChild(svgEl("path", { d: buildLinePath(points), class: "chart-line" }));

	for (let i = 0; i < points.length; i += 1) {
		const p = points[i];
		const row = data.hourly[i];
		if (p === undefined || row === undefined) continue;
		const dot = svgEl("circle", { cx: p.x, cy: p.y, r: 4, class: "chart-dot" });
		dot.appendChild(
			svgEl("title", null, `${hourBucketToKstLabel(row.hour_bucket)} · 요청 ${formatNumber(row.requests)}`),
		);
		svg.appendChild(dot);
	}

	drawXLabels(svg, data.hourly);

	root.appendChild(svg);

	const totalSum = cumulativeSeries(data.hourly, "total_tokens").at(-1)?.cumulative ?? 0;
	root.appendChild(
		el(
			"p",
			{ class: "stat-hint", style: "margin-top: 1rem; text-align: center;" },
			`24개 버킷(UTC) · 누적 토큰 ${abbreviateTokens(totalSum)} · 점에 마우스를 올리면 자세히 보입니다`,
		),
	);
};
