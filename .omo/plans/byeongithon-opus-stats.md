# 변기톤 오푸스 통계 · 작업 계획서

> 노마다마스 해커하우스 「변기톤」 기간 동안의 토큰 사용량을 시각화하는 정적 통계 대시보드.
> Cloudflare Workers + R2 + 초엄격 TypeScript. 데이터는 `sk-markers-*` 키 6개, 오늘 16시 KST까지.

## 핵심 사실
- **데이터**: 14,067 요청 · 14,042 성공 · 25 실패
- **토큰**: 총 4,385,134,301개 (캐시 읽기 4.06B, 캐시 생성 311M, 출력 12M, 입력 74K)
- **비용**: USD $4,176.45
- **키 수**: 6개 (nebula · nova · aurora · vertex · zenith · apex)
- **주요 모델**: claude-opus-4-7 (99.4% 비용)
- **기간**: 2026-05-18 00:00 UTC ~ 2026-05-19 07:00 UTC (KST 기준 5/18 09:00 ~ 5/19 16:00)
- **도메인**: `toilet-nomad.mengmota.com`
- **레포**: `code-yeongyu/byeongithon-opus-stats`

## 아키텍처 결정

```
┌──────────────────────────────────────────────┐
│  Cloudflare Worker (toilet-nomad.mengmota.com)│
│  • 정적 자산 (HTML / CSS / JS) 직접 서빙       │
│  • Cache-Control: 1년, immutable               │
│  • CSV 다운로드 라우트 → R2 프록시              │
└────────────────────┬─────────────────────────┘
                     │ fetch()
                     ▼
┌──────────────────────────────────────────────┐
│  R2 Bucket (byeongithon-opus-stats)           │
│  • total.csv · key_breakdown.csv              │
│  • model_breakdown.csv · hourly.csv           │
│  • Public read with long-lived cache headers  │
└──────────────────────────────────────────────┘
```

- ccapi 백엔드는 **직접 노출 금지**. 모든 CSV는 정적 파일.
- 브라우저 캐싱 적극 활용. `Cache-Control: public, max-age=31536000, immutable`.
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

- [x] `src/data/types.ts` — Zod 스키마 + 브랜드 타입 (TotalRow, KeyRow, ModelRow, HourlyRow)
- [x] `src/data/parser.ts` — 손쉬운 CSV 파서 (RFC 4180 따옴표 처리)
- [x] `src/data/loader.ts` — fetch + parse + 검증
- [x] `test/parser.test.ts` — CSV 파싱 단위 테스트 (실제 데이터 fixture 사용)
- [x] `test/loader.test.ts` — 로더 통합 테스트
- [x] R2 업로드 스크립트 (`scripts/upload-r2.ts`)

## Phase 2 · 디자인 & 자산

- [x] 히어로 이미지 생성 (imagegen · GPT Image 2) — 변기톤 + Claude 토큰 테마
- [x] OG 이미지 생성 (소셜 미디어 1200×630)
- [x] 파비콘 (이모지 🚽 SVG)
- [x] 카피라이팅 (한국어, 변기톤 톤 매치)
- [x] 디자인 시스템 (Linear/Vercel 영감, 다크 모드 우선, 토일렛 액센트)

## Phase 3 · 프론트엔드 (Static SPA)

- [x] `public/index.html` — 메타 태그, OG, preconnect
- [x] `src/ui/styles.css` — 반응형 디자인, 다크 모드, prefers-reduced-motion 대응
- [x] `src/ui/app.ts` — 메인 진입점 (250 LOC 미만)
- [x] `src/ui/views/overview.ts` — 총 사용량 카드 (요청·토큰·비용)
- [x] `src/ui/views/keys.ts` — 키별 분석 (정렬·필터)
- [x] `src/ui/views/models.ts` — 모델별 분석
- [x] `src/ui/views/hourly.ts` — 시간별 차트 (Canvas 기반, 라이브러리 없이)
- [x] `src/ui/components/card.ts` — 통계 카드
- [x] `src/ui/components/chart.ts` — Canvas 기반 차트 (막대 + 라인)
- [x] `src/ui/components/table.ts` — 정렬 가능한 데이터 테이블
- [x] `src/ui/format.ts` — 숫자/통화/시간 포맷터 (한국어)

## Phase 4 · Cloudflare Worker

- [x] `src/worker.ts` — Hono Worker 엔트리
- [x] `src/worker/routes.ts` — 라우트 정의
- [x] `src/worker/cache.ts` — Cache-Control 헤더 관리
- [x] `src/worker/r2-proxy.ts` — R2에서 CSV 프록시 (캐시 헤더 포함)
- [x] 빌드 스크립트 (`scripts/build.ts`)
- [x] R2 버킷 생성 + CSV 업로드

## Phase 5 · GitHub 저장소

- [x] `README.md` (한국어, 데이터 요약 + 어트리뷰션)
- [x] `.github/workflows/ci.yml` — typecheck + lint + test
- [x] `.github/workflows/deploy.yml` — main 푸시시 wrangler deploy
- [x] `.github/branch-ruleset.json` — main 보호
- [x] `.github/CODEOWNERS`
- [x] `.github/dependabot.yml`
- [x] `.github/pull_request_template.md`
- [x] `.github/ISSUE_TEMPLATE/bug.yml`
- [x] `.github/ISSUE_TEMPLATE/feature.yml`
- [x] GitHub 레포 생성 (`code-yeongyu/byeongithon-opus-stats`)
- [x] Description + topics 설정
- [x] Initial commit + push
- [x] Branch protection rule 적용

## Phase 6 · QA & 최적화

- [x] Vitest 모든 단위 테스트 통과
- [x] Biome `check` 무경고
- [x] `tsgo --noEmit` 무에러
- [x] Playwright 헤드리스 매뉴얼 QA (모바일 375×667 · 태블릿 768×1024 · 데스크탑 1440×900)
- [x] 모든 차트가 정확한 숫자 렌더링 검증
- [x] CSV 다운로드 동작 검증
- [x] Lighthouse 100/100/100/100 (Performance · Accessibility · Best Practices · SEO) — 실제 브라우저로
- [x] 애니메이션 prefers-reduced-motion 대응 검증

## Phase 7 · 배포 & 푸시

- [x] `wrangler deploy --env production`
- [x] 커스텀 도메인 `toilet-nomad.mengmota.com` 매핑
- [x] 라이브 URL 확인 (HTTPS · OG 카드 · 데이터 로딩)
- [x] 첫 GitHub 릴리스 (`v0.1.0`)

---

## 어트리뷰션

- **만든 사람**: [Yeongyu Kim (@code-yeongyu)](https://github.com/code-yeongyu) — 토큰 후원 + 웹사이트 제작
- **사용한 도구**: [Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent) (단 하나의 프롬프트로 완성)
- **토큰 후원**: [시지푸스랩스 (Sisyphus Labs)](https://sisyphuslabs.ai) · 대기 명단 가입
- **데이터 소스**: 노마다마스 해커하우스 「변기톤」, [@vkehfdl1 Jeffrey Kim](https://github.com/vkehfdl1) 주최
- **소스 코드**: [code-yeongyu/byeongithon-opus-stats](https://github.com/code-yeongyu/byeongithon-opus-stats)

## 룰 준수
- 파일당 순수 LOC 250 이하
- `as any`, `@ts-ignore`, `x!` 금지
- Zod로 외부 입력 검증
- 브랜드 타입으로 ID 분리
- 모든 switch는 `assertNever`로 종결
