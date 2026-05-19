/**
 * Cloudflare Worker 엔트리.
 *
 * 거의 정적 자산만 서빙한다. 추가 기능:
 *  - /api/healthz: 상태 체크 (단순 JSON)
 *  - /data/* : 정적 CSV에 강한 캐시 헤더 적용
 *  - /assets/* : 1년 immutable 캐시
 *  - 기타 라우트: ASSETS 바인딩이 SPA fallback 처리
 */

export interface Env {
	readonly ASSETS: Fetcher;
	readonly DATA_BUCKET: R2Bucket;
	readonly SITE_NAME: string;
	readonly CUTOFF_KST: string;
}

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const applySecurityHeaders = (response: Response): Response => {
	const headers = new Headers(response.headers);
	for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const withCache = (response: Response, cacheControl: string): Response => {
	const headers = new Headers(response.headers);
	headers.set("Cache-Control", cacheControl);
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const handleHealth = (env: Env): Response =>
	new Response(
		JSON.stringify({ ok: true, site: env.SITE_NAME, cutoff_kst: env.CUTOFF_KST, ts: new Date().toISOString() }),
		{ headers: { "Content-Type": "application/json; charset=utf-8" } },
	);

const handleStatic = async (request: Request, env: Env, cacheControl: string): Promise<Response> => {
	const res = await env.ASSETS.fetch(request);
	return withCache(res, cacheControl);
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/api/healthz") {
			return applySecurityHeaders(handleHealth(env));
		}

		if (url.pathname.startsWith("/data/") && url.pathname.endsWith(".csv")) {
			const res = await handleStatic(request, env, "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
			return applySecurityHeaders(res);
		}

		if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/js/")) {
			const res = await handleStatic(request, env, "public, max-age=31536000, immutable");
			return applySecurityHeaders(res);
		}

		if (url.pathname === "/" || url.pathname.endsWith(".html") || !url.pathname.includes(".")) {
			const res = await handleStatic(request, env, "public, max-age=0, must-revalidate");
			return applySecurityHeaders(res);
		}

		// Fallback to assets binding
		const res = await env.ASSETS.fetch(request);
		return applySecurityHeaders(res);
	},
} satisfies ExportedHandler<Env>;
