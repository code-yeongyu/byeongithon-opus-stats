/**
 * 변기톤 오푸스 통계 — UI 엔트리.
 *
 * DOM 준비되면 CSV 4종을 fetch + parse 후 DashStore를 만들고,
 * 인터랙티브 컴포넌트들을 마운트한다.
 */

import { DEFAULT_SOURCES, loadDashboardData } from "../lib/loader.ts";
import type { DashboardData } from "../lib/types.ts";
import { renderControls } from "./render/controls.ts";
import { renderHero } from "./render/hero.ts";
import { renderHourlyChart } from "./render/hourly-chart.ts";
import { renderKeysTable } from "./render/keys-table.ts";
import { renderModelsTable } from "./render/models-table.ts";
import { renderStats } from "./render/stats.ts";
import { DashStore } from "./state.ts";

const onReady = (fn: () => void): void => {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", fn, { once: true });
	} else {
		fn();
	}
};

const mountAll = (data: DashboardData): void => {
	const allKeys = data.keys.map((k) => k.key_name as string);
	const store = new DashStore({
		metric: "total_tokens",
		selectedKeys: new Set(allKeys),
		allKeys,
	});
	renderHero(data);
	renderControls(store, data);
	renderStats(store, data);
	renderKeysTable(store, data);
	renderModelsTable(store, data);
	renderHourlyChart(store, data);
};

const renderError = (err: unknown): void => {
	console.error("[byeongithon-opus-stats] 데이터 로딩 실패", err);
	for (const sel of ["stats-grid", "controls", "keys-table", "models-table", "hourly-chart"]) {
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
