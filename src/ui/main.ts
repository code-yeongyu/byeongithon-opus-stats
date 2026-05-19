/**
 * 변기톤 오푸스 통계 — UI 엔트리
 *
 * DOM이 준비되면 CSV 4종을 fetch + parse하고, 4개 섹션을 렌더링한다.
 */

import { DEFAULT_SOURCES, loadDashboardData } from "../lib/loader.ts";
import type { DashboardData } from "../lib/types.ts";
import { renderHero } from "./render/hero.ts";
import { renderHourlyChart } from "./render/hourly-chart.ts";
import { renderKeysTable } from "./render/keys-table.ts";
import { renderModelsTable } from "./render/models-table.ts";
import { renderStats } from "./render/stats.ts";

const onReady = (fn: () => void): void => {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", fn, { once: true });
	} else {
		fn();
	}
};

const mountAll = (data: DashboardData): void => {
	renderHero(data);
	renderStats(data);
	renderKeysTable(data);
	renderModelsTable(data);
	renderHourlyChart(data);
};

const renderError = (err: unknown): void => {
	console.error("[byeongithon-opus-stats] 데이터 로딩 실패", err);
	for (const sel of ["stats-grid", "keys-table", "models-table", "hourly-chart"]) {
		const node = document.querySelector(`[data-component="${sel}"]`);
		if (node) node.innerHTML = `<p class="stat-loading">데이터를 불러오지 못했어요. 새로고침 해주세요.</p>`;
	}
};

const bootstrap = async (): Promise<void> => {
	try {
		const data = await loadDashboardData(DEFAULT_SOURCES);
		mountAll(data);
	} catch (err) {
		renderError(err);
	}
};

onReady(() => {
	void bootstrap();
});
