/**
 * 인터랙티브 컨트롤 — 메트릭 스위처 + 키 필터 칩.
 *
 * 사용자가 직접 분석 축을 바꿔가며 대시보드를 재계산할 수 있게 한다.
 */

import { maskKeyName } from "../../lib/format.ts";
import type { DashboardData } from "../../lib/types.ts";
import { clearNode, el } from "../dom.ts";
import { type DashMetric, type DashStore, METRIC_LABEL } from "../state.ts";

const METRICS_ORDER: readonly DashMetric[] = ["requests", "total_tokens", "cost_usd", "cache_read_input_tokens"];

const renderMetricSwitcher = (store: DashStore): HTMLElement => {
	const group = el("div", {
		class: "controls-metric",
		role: "radiogroup",
		"aria-label": "대시보드 메트릭 선택",
	});
	const buttons = new Map<DashMetric, HTMLButtonElement>();

	const sync = (current: DashMetric): void => {
		for (const [m, btn] of buttons) {
			const isOn = m === current;
			btn.setAttribute("aria-checked", String(isOn));
			btn.classList.toggle("is-active", isOn);
		}
	};

	for (const metric of METRICS_ORDER) {
		const btn = el(
			"button",
			{
				type: "button",
				class: "controls-metric__btn",
				role: "radio",
				"aria-checked": "false",
				"data-metric": metric,
			},
			METRIC_LABEL[metric],
		) as HTMLButtonElement;
		btn.addEventListener("click", () => store.setMetric(metric));
		buttons.set(metric, btn);
		group.appendChild(btn);
	}

	store.subscribe((state) => sync(state.metric));
	return group;
};

const renderKeyChips = (store: DashStore, data: DashboardData): HTMLElement => {
	const wrap = el("div", { class: "controls-keys" });
	const label = el(
		"div",
		{ class: "controls-keys__label" },
		"키 필터:",
		el("button", { type: "button", class: "controls-keys__all" }, "전체"),
	);
	const allBtn = label.querySelector<HTMLButtonElement>(".controls-keys__all");
	if (allBtn !== null) {
		allBtn.addEventListener("click", () => store.selectAllKeys());
	}
	wrap.appendChild(label);

	const chipBox = el("div", { class: "controls-keys__chips" });
	const buttons = new Map<string, HTMLButtonElement>();

	for (const key of data.keys) {
		const keyName = key.key_name as string;
		const chip = el(
			"button",
			{
				type: "button",
				class: "key-chip",
				"data-key": keyName,
				"aria-pressed": "true",
			},
			maskKeyName(keyName),
		) as HTMLButtonElement;
		chip.addEventListener("click", () => store.toggleKey(keyName));
		buttons.set(keyName, chip);
		chipBox.appendChild(chip);
	}
	wrap.appendChild(chipBox);

	store.subscribe((state) => {
		for (const [key, btn] of buttons) {
			const isOn = state.selectedKeys.has(key);
			btn.setAttribute("aria-pressed", String(isOn));
			btn.classList.toggle("is-off", !isOn);
		}
	});

	return wrap;
};

export const renderControls = (store: DashStore, data: DashboardData): void => {
	const root = document.querySelector('[data-component="controls"]');
	if (root === null) return;
	clearNode(root);
	root.appendChild(renderMetricSwitcher(store));
	root.appendChild(renderKeyChips(store, data));
};
