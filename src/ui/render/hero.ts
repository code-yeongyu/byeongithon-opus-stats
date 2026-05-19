/**
 * 히어로 영역의 동적 통계 슬롯을 채운다 (data-stat 속성 기반).
 */

import { successRate } from "../../lib/aggregate.ts";
import { abbreviateTokens, formatNumber, formatPercent, formatUsd } from "../../lib/format.ts";
import type { DashboardData } from "../../lib/types.ts";

export const renderHero = (data: DashboardData): void => {
	const total = data.total;
	const slots = document.querySelectorAll<HTMLElement>("[data-stat]");
	for (const node of slots) {
		const slot = node.dataset["stat"];
		if (slot === undefined) continue;
		switch (slot) {
			case "total-requests":
			case "kpi-requests":
				node.textContent = formatNumber(total.requests);
				break;
			case "total-tokens":
			case "kpi-tokens":
				node.textContent = abbreviateTokens(total.total_tokens);
				break;
			case "total-cost":
			case "kpi-cost":
				node.textContent = formatUsd(total.cost_usd).replace(/[\s\u00A0]/g, "");
				break;
			case "kpi-success":
				node.textContent = formatPercent(successRate(total));
				break;
			default:
				break;
		}
	}
};
