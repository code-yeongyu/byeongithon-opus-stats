/**
 * 빌드 스크립트: src/ui → dist/js, public → dist, data → dist/data.
 *
 * - bun build를 사용해 src/ui/main.ts를 단일 IIFE 번들로 만든다 (브라우저 타겟).
 * - public/ 안의 정적 자산을 dist/로 복사한다.
 * - data/*.csv를 dist/data/로 복사한다.
 */

import { $ } from "bun";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");
const PUBLIC = resolve(ROOT, "public");
const DATA = resolve(ROOT, "data");
const UI_ENTRY = resolve(ROOT, "src/ui/main.ts");

const log = (msg: string): void => console.log(`[build] ${msg}`);

const clean = async (): Promise<void> => {
	log("clean dist/");
	await rm(DIST, { recursive: true, force: true });
	await mkdir(DIST, { recursive: true });
	await mkdir(resolve(DIST, "js"), { recursive: true });
	await mkdir(resolve(DIST, "data"), { recursive: true });
	await mkdir(resolve(DIST, "assets"), { recursive: true });
};

const copyPublic = async (): Promise<void> => {
	log("copy public/ → dist/");
	const entries = await readdir(PUBLIC, { withFileTypes: true });
	for (const e of entries) {
		const src = resolve(PUBLIC, e.name);
		const dst = resolve(DIST, e.name);
		await cp(src, dst, { recursive: true });
	}
};

const copyData = async (): Promise<void> => {
	log("copy data/*.csv → dist/data/");
	const files = await readdir(DATA);
	for (const f of files) {
		if (!f.endsWith(".csv")) continue;
		await cp(resolve(DATA, f), resolve(DIST, "data", f));
	}
};

const bundleUi = async (): Promise<void> => {
	log("bundle src/ui/main.ts → dist/js/main.js");
	const result = await Bun.build({
		entrypoints: [UI_ENTRY],
		outdir: resolve(DIST, "js"),
		target: "browser",
		minify: true,
		sourcemap: "none",
		format: "esm",
		naming: "[dir]/[name].[ext]",
	});
	if (!result.success) {
		console.error(result.logs);
		throw new Error("UI bundle failed");
	}
};

const reportSizes = async (): Promise<void> => {
	log("dist sizes:");
	await $`du -sh ${DIST}/*`.quiet().then((p) => console.log(p.stdout.toString()));
};

const main = async (): Promise<void> => {
	const start = Date.now();
	await clean();
	await copyPublic();
	await copyData();
	await bundleUi();
	await reportSizes();
	log(`done in ${Date.now() - start}ms`);
};

await main();
