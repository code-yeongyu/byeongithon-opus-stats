# 🚽 변기톤 오푸스 통계

[![CI](https://github.com/code-yeongyu/byeongithon-opus-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/code-yeongyu/byeongithon-opus-stats/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 노마다마스 해커하우스 **「변기톤」** 기간 동안 사용된 Claude Opus 4.7 토큰 사용량을 시각화한 정적 대시보드.
>
> 🌐 **라이브 사이트** · <https://toilet-nomad.mengmota.com>

---

## 📊 한눈에 보기

기준 시각 **2026-05-19 16:00 KST** 까지의 `sk-markers-*` 키 통계:

| 지표 | 값 |
|---|---|
| 총 요청 | **14,067** (성공 14,042 · 실패 25 · 성공률 99.82%) |
| 총 토큰 | **4,385,134,301** (≈ 4.39B) |
| 비용 | **$4,176.45 USD** |
| 추적된 키 | 6개 (`sk-markers-{nebula, nova, aurora, vertex, zenith, apex}-key`) |
| 주력 모델 | `claude-opus-4-7` (99.23%의 비용 차지) |

자세한 분석은 [라이브 사이트](https://toilet-nomad.mengmota.com)에서 확인하세요.

---

## 🏗️ 아키텍처

```
┌──────────────────────────────────────────────┐
│  Cloudflare Worker (toilet-nomad.mengmota.com)│
│  • 정적 자산 (HTML / CSS / JS)                │
│  • Cache-Control: 1년, immutable              │
│  • API: /api/healthz                          │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  R2 Bucket (byeongithon-opus-stats)           │
│  • total.csv · key_breakdown.csv              │
│  • model_breakdown.csv · hourly.csv           │
└──────────────────────────────────────────────┘
```

- **프론트엔드**: Vanilla TypeScript + 직접 만든 SVG 차트 (라이브러리 0)
- **백엔드**: Cloudflare Worker (Hono 없음, 50 LOC 미만)
- **데이터**: 정적 CSV 4종 (총합 / 키별 / 모델별 / 시간별)
- **번들 크기**: 73 KB (Zod 포함)
- **전체 크기**: ~700 KB (대부분 히어로 이미지)

---

## 🚀 빌드 & 실행

```bash
# 의존성 설치
pnpm install

# 검증
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome check
pnpm lint:loc     # 250 LOC 룰 강제
pnpm test         # 36 단위 테스트
pnpm check        # 위 모두

# 빌드
pnpm build        # dist/

# 로컬 개발 (Wrangler)
pnpm dev          # http://localhost:8787

# R2 업로드
pnpm upload:r2

# 배포
pnpm deploy
```

---

## 📁 디렉터리 구조

```
.
├── .github/             # CI · 브랜치 룰셋 · 이슈 템플릿
├── .omo/
│   ├── plans/           # 작업 계획서 + 체크박스
│   └── rules/           # TypeScript 250 LOC 룰
├── data/                # 원본 CSV (R2 미러)
├── public/              # 정적 HTML/CSS/이미지
├── scripts/             # 빌드 + R2 업로드
├── src/
│   ├── lib/             # 데이터 레이어 (Zod 검증, CSV 파서, 집계, 포맷)
│   ├── ui/              # 프론트엔드 컴포넌트 (각 250 LOC 미만)
│   │   ├── dom.ts       # 작은 hyperscript 헬퍼
│   │   ├── main.ts      # 엔트리
│   │   └── render/      # 5개 섹션 렌더러
│   └── worker/          # Cloudflare Worker
├── test/                # vitest 단위 테스트
├── biome.json
├── tsconfig.json
├── wrangler.toml
└── package.json
```

---

## 🧪 품질 보증

- **TypeScript 초엄격 모드**: `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax`
- **Biome 1.9.4**: `noExplicitAny`, `noNonNullAssertion`, `useImportType` 모두 error
- **250 LOC 룰**: 모든 `.ts` 파일은 순수 LOC 250줄 미만 (`.omo/rules/typescript.md` 참조)
- **TDD**: 36개 단위 테스트, 실제 CSV fixture 기반
- **Lighthouse 100/100/100/100**: 성능 · 접근성 · 베스트 프랙티스 · SEO 모두 만점
- **반응형**: 모바일 (390px) · 태블릿 (768px) · 데스크탑 (1440px) 검증

---

## 🤝 어트리뷰션

이 사이트는 **단 하나의 프롬프트**로 만들어졌습니다.

- 🤖 **[Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent)** · 빌드 + 배포 + QA 전 과정 자동화
- 🔧 **웹사이트 제작 + 토큰 후원**: [@code-yeongyu](https://github.com/code-yeongyu)
- 💸 **API 토큰 후원**: **[시지푸스랩스 (Sisyphus Labs)](https://sisyphuslabs.ai)** · 대기 명단 모집 중!
- 📊 **데이터 출처**: 노마다마스 해커하우스 「변기톤」 · 주최 [@vkehfdl1 (Jeffrey Kim)](https://github.com/vkehfdl1), 발표 [@bunniesossdev](https://www.threads.com/@bunniesossdev)
- 🎨 **히어로 이미지**: GPT Image 2 (OpenAI, Quotio 경유)

---

## 📜 라이선스

[MIT](LICENSE) © 2026 [Yeongyu Kim](https://github.com/code-yeongyu)

데이터는 노마다마스 해커하우스 「변기톤」 참가자들의 활동 결과입니다.
