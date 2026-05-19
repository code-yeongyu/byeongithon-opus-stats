/**
 * DOM 헬퍼 — 작은 hyperscript-like 함수.
 */

export type Attrs = Readonly<Record<string, string | number | boolean | undefined>>;

export const el = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	attrs?: Attrs | null,
	...children: readonly (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] => {
	const node = document.createElement(tag);
	if (attrs) {
		for (const [k, v] of Object.entries(attrs)) {
			if (v === undefined || v === false) continue;
			if (k === "class") node.className = String(v);
			else if (k === "html") node.innerHTML = String(v);
			else node.setAttribute(k, String(v));
		}
	}
	for (const child of children) {
		if (child === null || child === undefined || child === false) continue;
		node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
	}
	return node;
};

export const $ = <T extends HTMLElement = HTMLElement>(selector: string): T | null =>
	document.querySelector<T>(selector);

export const $$ = <T extends HTMLElement = HTMLElement>(selector: string): readonly T[] =>
	Array.from(document.querySelectorAll<T>(selector));

export const clearNode = (node: Element): void => {
	while (node.firstChild) node.removeChild(node.firstChild);
};

export const setText = (node: Element | null, text: string): void => {
	if (node) node.textContent = text;
};

export const svgEl = <K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs?: Attrs | null,
	...children: readonly (Node | string)[]
): SVGElementTagNameMap[K] => {
	const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
	if (attrs) {
		for (const [k, v] of Object.entries(attrs)) {
			if (v === undefined || v === false) continue;
			node.setAttribute(k, String(v));
		}
	}
	for (const child of children) {
		node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
	}
	return node;
};
