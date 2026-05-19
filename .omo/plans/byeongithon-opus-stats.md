# 변기톤 오푸스 통계 · 작업 계획서

> 노마다마스 해커하우스 「변기톤」 기간 동안의 토큰 사용량을 시각화하는 정적 통계 대시보드.
> Cloudflare Workers + R2 + 초엄격 TypeScript. 데이터는 `sk-markers-*` 키 6개, 오늘 16시 KST까지.
>
> ✅ **상태**: 라이브 배포 완료. https://toilet-nomad.mengmota.com (Lighthouse 100/100/100/100)

## 핵심 사실
- **데이터**: 14,067 요청 · 14,042 성공 · 25 실패 · 성공률 99.82%
- **토큰**: 총 4,385,134,301개 (캐시 읽기 4.06B, 캐시 생성 311M, 출력 12M, 입력 74K)
- **비용**: USD $4,176.45
- **키 수**: 6개 (nebula · nova · aurora · vertex · zenith · apex)
- **주요 모델**: claude-opus-4-7 (99.23% 비용)
- **기간**: 2026-05-18 00:00 UTC ~ 2026-05-19 07:00 UTC (KST 기준 5/18 09:00 ~ 5/19 16:00)
- **도메인**: `toilet-nomad.mengmota.com`
- **레포**: `code-yeongyu/byeongithon-opus-stats`

## 아키텍처 결정

```
┌──────────────────────────────────────────────┐
│  Cloudflare Worker (toilet-nomad.mengmota.com)│
│  • 정적 자산 (HTML / CSS / JS) 직접 서빙       │
│  • Cache-Control: 1년, immutable               │
│  • /api/healthz 엔드포인트                      │
└────────────────────┬─────────────────────────┘
                     │ fetch()
                     ▼
┌──────────────────────────────────────────────┐
│  R2 Bucket (byeongithon-opus-stats)           │
│  • total.csv · key_breakdown.csv              │
│  • model_breakdown.csv · hourly.csv           │
└──────────────────────────────────────────────┘
```

- ccapi 백엔드는 **직접 노출 금지**. 모든 CSV는 정적 파일.
- 브라우저 캐싱 적극 활용.
- 모바일/태블릿/데스크탑 반응형.

---

## Phase 0 · 기반 (Foundation)

- [x] 작업 디렉터리 부트스트랩 (`src/`, `data/`, `public/`, `test/`, `.github/`)
- [x] CSV 데이터 4종 복사 (`data/total.csv`, `data/key_breakdown.csv`, `data/model_breakdown.csv`, `data/hourly.csv`)
- [x] git 저장소 초기화 (main 브랜치)
- [x] `.omo/rules/typescript.md` — 「모든 코드는 250 LOC를 넘을 수 없다」 룰
- [x] `package.json` (Bun + pnpm 호환, 초엄격 TS 스크립트)
- [x] `tsconfig.json` (strict 전체 + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)
- [x] `biome.json` (탭 들여쓰기 3폭, 120자, `noExplicitAny` error)
- [x] `wrangler.toml` (Workers + R2 바인딩 + 커스텀 도메인)
- [x] `vitest.config.ts`
- [x] `.gitignore` (`node_modules`, `dist`, `coverage`, `.wrangler`, `.DS_Store`)
- [x] `LICENSE` (MIT, Copyright 2026 Yeongyu Kim)
- [x] `NOTICE` (oh-my-openagent · Sisyphus Labs 후원)
- [x] `CHANGELOG.md` (Keep-a-Changelog)

## Phase 1 · 데이터 파이프라인

- [x] `src/lib/types.ts` — Zod 스키마 + 4종 row 타입 (TotalRow, KeyRow, ModelRow, HourlyRow)
- [x] `src/lib/csv.ts` — RFC 4180 CSV 파서
- [x] `src/lib/loader.ts` — fetch + parse + Zod 검증 (DataLoadError)
- [x] `src/lib/format.ts` — 한국어 포맷터 (formatNumber, formatUsd, abbreviateTokens, hourBucketToKstLabel 외)
- [x] `src/lib/aggregate.ts` — 집계 (rankByMetric, successRate, cumulativeSeries, maxByMetric)
- [x] `test/csv.test.ts` — CSV 파싱 단위 테스트 (실제 데이터 fixture 사용, 11개)
- [x] `test/loader.test.ts` — 로더 통합 테스트 (8개)
- [x] `test/format.test.ts` — 포맷터 테스트 (9개)
- [x] `test/aggregate.test.ts` — 집계 함수 테스트 (8개)
- [x] R2 업로드 스크립트 (`scripts/upload-to-r2.sh`)
- [x] 36 단위 테스트 모두 통과

## Phase 2 · 디자인 & 자산

- [x] 히어로 이미지 생성 (imagegen · GPT Image 2) — 사이버펑크 변기 + 홀로그램 차트 테마
- [x] WebP 최적화 (41KB 모바일 · 148KB 데스크탑 · 417KB JPG fallback)
- [x] 파비콘 (이모지 🚽 SVG, 그라데이션 적용)
- [x] 한국어 카피라이팅 — 히어로 헤드라인, 섹션 부제, 푸터 어트리뷰션
- [x] 다크 모드 우선 디자인 시스템 — teal/magenta accent, 시스템 폰트 (Pretendard fallback)
- [x] OG 메타 태그 (소셜 미디어 공유용)

## Phase 3 · 프론트엔드 (Static SPA)

- [x] `public/index.html` — 메타 태그, OG, preconnect, preload, semantic HTML
- [x] `public/styles.css` — 반응형 디자인, 다크/라이트 모드, prefers-reduced-motion 대응 (507 LOC CSS)
- [x] `src/ui/main.ts` — 엔트리 (DOMContentLoaded → 로드 + 마운트)
- [x] `src/ui/dom.ts` — hyperscript 헬퍼 (el, clearNode, svgEl)
- [x] `src/ui/render/hero.ts` — 히어로 KPI 슬롯 채우기 (4개)
- [x] `src/ui/render/stats.ts` — 총괄 8개 카드
- [x] `src/ui/render/keys-table.ts` — 키별 테이블 (정렬 + 비중 막대)
- [x] `src/ui/render/models-table.ts` — 모델별 테이블 (비용 정렬)
- [x] `src/ui/render/hourly-chart.ts` — SVG 시간별 차트 (라이브러리 없이)
- [x] 모든 `.ts` 파일 < 250 LOC 검증 통과

## Phase 4 · Cloudflare Worker

- [x] `src/worker/index.ts` — Worker 엔트리 (76 LOC)
- [x] Cache-Control 헤더 (immutable, 5분, must-revalidate)
- [x] 보안 헤더 (X-Frame-Options, CSP, Referrer-Policy, HSTS)
- [x] `/api/healthz` JSON 엔드포인트
- [x] R2 바인딩 (DATA_BUCKET)
- [x] 정적 자산 바인딩 (ASSETS)
- [x] 빌드 스크립트 (`scripts/build.ts`) — Bun build, 10ms
- [x] R2 버킷 생성 (`byeongithon-opus-stats` + `-dev`)
- [x] CSV 4종 R2 업로드

## Phase 5 · GitHub 저장소

- [x] `README.md` (한국어, 데이터 요약 + 아키텍처 + 어트리뷰션)
- [x] `.github/workflows/ci.yml` — lint + typecheck + LOC + test + build (Ubuntu+macOS × node 22)
- [x] `.github/workflows/deploy.yml` — main 푸시시 wrangler deploy + R2 업로드
- [x] `.github/branch-ruleset.json` — main 보호
- [x] `.github/CODEOWNERS` (* @code-yeongyu)
- [x] `.github/dependabot.yml` (npm + github-actions, weekly)
- [x] `.github/pull_request_template.md` (한국어)
- [x] `.github/ISSUE_TEMPLATE/bug.yml` (한국어 버그 신고)
- [x] `.github/ISSUE_TEMPLATE/feature.yml` (한국어 기능 제안)
- [x] GitHub 레포 생성 (`code-yeongyu/byeongithon-opus-stats`) — public
- [x] Description + topics 11개 설정 (byeongithon, nomadamas, claude, opus, cloudflare-workers, r2, typescript, dashboard, analytics, oh-my-openagent, sisyphus-labs)
- [x] Initial commit + push (5개 commits, main 브랜치 trackin)
- [x] Branch protection rule 적용 (gh API ruleset via .github/branch-ruleset.json)

## Phase 6 · QA & 최적화

- [x] Vitest 모든 단위 테스트 통과 (36/36)
- [x] Biome `check` 무경고 (17 files)
- [x] `tsc --noEmit` 무에러
- [x] `scripts/check-loc-limit.sh` — 모든 `.ts` 파일 ≤ 250 LOC 확인
- [x] Playwright 헤드리스 매뉴얼 QA (모바일 390px · 태블릿 768px · 데스크탑 1440px)
- [x] 모든 차트가 정확한 숫자 렌더링 검증 (스크린샷으로 확인)
- [x] CSV 다운로드 동작 검증 (4개 다운로드 카드)
- [x] **Lighthouse 100/100/100/100 데스크탑** (실제 Chrome 브라우저, lighthouse CLI 아님)
- [x] **Lighthouse 100/100/100/100 모바일** (lh form-factor=mobile)
- [x] 애니메이션 prefers-reduced-motion 대응 (CSS 미디어 쿼리)
- [x] 디자인 QA — 히어로 KPI 4셀 + 섹션 키커 01-05 + accent 그라데이션

## Phase 7 · 배포 & 푸시

- [x] `wrangler deploy --env production` (Version ID: 016072e5-...)
- [x] 커스텀 도메인 `toilet-nomad.mengmota.com` 매핑
- [x] 라이브 URL 확인 (HTTPS 200 · OG 카드 · 데이터 로딩 · 콘솔 에러 0)
- [x] robots.txt + sitemap.xml 추가
- [x] 최종 GitHub 푸시 (모든 변경사항)

---

## 어트리뷰션 (사이트 + README 양쪽)

- **만든 사람**: [Yeongyu Kim (@code-yeongyu)](https://github.com/code-yeongyu) — 토큰 후원 + 웹사이트 제작
- **사용한 도구**: [Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent) (단 하나의 프롬프트로 완성)
- **토큰 후원**: [시지푸스랩스 (Sisyphus Labs)](https://sisyphuslabs.ai) · 대기 명단 가입
- **데이터 소스**: 노마다마스 해커하우스 「변기톤」, [@vkehfdl1 Jeffrey Kim](https://github.com/vkehfdl1) 주최
- **소스 코드**: [code-yeongyu/byeongithon-opus-stats](https://github.com/code-yeongyu/byeongithon-opus-stats)

## 룰 준수 (전체 검증 완료)
- ✅ 파일당 순수 LOC 250 이하 (`scripts/check-loc-limit.sh` 통과)
- ✅ `as any`, `@ts-ignore`, `x!` 0건 (Biome 강제)
- ✅ Zod로 외부 입력 검증 (CSV)
- ✅ 모든 외부 fetch는 Zod 스키마 통과
- ✅ 모든 switch는 exhaustive (`assertNever` 패턴 + default fallthrough)
