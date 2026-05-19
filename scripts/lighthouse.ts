#!/usr/bin/env bun
/**
 * Run Lighthouse against a real Chrome browser (NOT lighthouse CLI).
 * Reports the 4 category scores: Performance / Accessibility / Best Practices / SEO.
 *
 * Usage: bun run scripts/lighthouse.ts [url]
 */

import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const url = process.argv[2] ?? "https://toilet-nomad.mengmota.com/";

const chrome = await chromeLauncher.launch({
	chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
});

try {
	const result = await lighthouse(url, {
		port: chrome.port,
		output: "json",
		logLevel: "error",
		onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
		formFactor: "desktop",
		screenEmulation: {
			mobile: false,
			width: 1440,
			height: 900,
			deviceScaleFactor: 1,
			disabled: false,
		},
		throttling: {
			rttMs: 40,
			throughputKbps: 10240,
			cpuSlowdownMultiplier: 1,
			requestLatencyMs: 0,
			downloadThroughputKbps: 0,
			uploadThroughputKbps: 0,
		},
	});

	if (!result) throw new Error("Lighthouse returned no result");

	const cats = result.lhr.categories;
	const rows = ["performance", "accessibility", "best-practices", "seo"].map((key) => {
		const cat = cats[key];
		const score = cat?.score ?? 0;
		const pct = Math.round(score * 100);
		const badge = pct === 100 ? "✅" : pct >= 90 ? "🟡" : "🔴";
		return { key, name: cat?.title ?? key, score: pct, badge };
	});

	console.log(`\n📊 Lighthouse Report for ${url}\n`);
	for (const r of rows) {
		console.log(`  ${r.badge}  ${r.name.padEnd(20)} ${r.score}/100`);
	}

	// Print actionable opportunities for failing categories
	const audits = result.lhr.audits;
	const issues: { id: string; title: string; score: number }[] = [];
	for (const [id, audit] of Object.entries(audits)) {
		const score = (audit as { score: number | null }).score;
		if (score === null || score === 1) continue;
		const title = (audit as { title: string }).title;
		issues.push({ id, title, score });
	}
	issues.sort((a, b) => a.score - b.score);
	if (issues.length > 0) {
		console.log(`\n🔧 Top issues (score < 1.0):`);
		for (const issue of issues.slice(0, 10)) {
			console.log(`  - [${(issue.score * 100).toFixed(0).padStart(3)}] ${issue.title}`);
		}
	}

	const all100 = rows.every((r) => r.score === 100);
	if (!all100) process.exitCode = 1;
} finally {
	await chrome.kill();
}
