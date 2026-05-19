/**
 * 대시보드 상태 + 옵저버 (subscribe / notify).
 *
 * 선택 가능한 메트릭과 필터링된 키 목록을 보관한다.
 * 상태 변경 시 등록된 subscribers를 모두 호출한다.
 */

import type { KeyRow } from "../lib/types.ts";

export type DashMetric = "requests" | "total_tokens" | "cost_usd" | "cache_read_input_tokens";

export const METRIC_LABEL: Readonly<Record<DashMetric, string>> = {
	requests: "요청 수",
	total_tokens: "총 토큰",
	cost_usd: "비용 (USD)",
	cache_read_input_tokens: "캐시 히트",
} as const;

export type DashState = {
	readonly metric: DashMetric;
	readonly selectedKeys: ReadonlySet<string>;
	readonly allKeys: readonly string[];
};

type Listener = (state: DashState) => void;

export class DashStore {
	private current: DashState;
	private readonly listeners = new Set<Listener>();

	constructor(initial: DashState) {
		this.current = initial;
	}

	public get state(): DashState {
		return this.current;
	}

	public setMetric(metric: DashMetric): void {
		if (metric === this.current.metric) return;
		this.current = { ...this.current, metric };
		this.emit();
	}

	public toggleKey(key: string): void {
		const next = new Set(this.current.selectedKeys);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		// 빈 선택 = 전체 선택으로 reset (사용자 혼란 방지)
		if (next.size === 0) for (const k of this.current.allKeys) next.add(k);
		this.current = { ...this.current, selectedKeys: next };
		this.emit();
	}

	public selectAllKeys(): void {
		const next = new Set(this.current.allKeys);
		this.current = { ...this.current, selectedKeys: next };
		this.emit();
	}

	public subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		listener(this.current);
		return () => this.listeners.delete(listener);
	}

	private emit(): void {
		for (const listener of this.listeners) listener(this.current);
	}
}

export const filteredKeys = (state: DashState, keys: readonly KeyRow[]): readonly KeyRow[] =>
	keys.filter((k) => state.selectedKeys.has(k.key_name as string));

export const isKeySelected = (state: DashState, keyName: string): boolean => state.selectedKeys.has(keyName);
