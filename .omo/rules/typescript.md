# TypeScript 룰 · 변기톤 오푸스 통계

## 절대 룰

### 1. 파일 길이 제한
**모든 TypeScript 파일은 250 LOC (Pure Lines of Code)를 넘을 수 없다.**

- Pure LOC = 빈 줄, 주석, import 문, 닫는 괄호만 있는 줄을 제외한 실제 코드 줄
- 250 LOC를 초과하는 파일은 즉시 분리한다
- 분리는 책임 단위로 한다 (한 파일 = 한 명확한 책임)
- 측정 도구: `scripts/check-loc.ts` (CI에서 강제)

### 2. 타입 안전성
- `any`, `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error` 전부 금지
- `x!` (non-null assertion) 금지 — 좁히기(narrowing) 또는 `x?.y` 사용
- `enum` 금지 — `as const` + 리터럴 유니온 사용
- 모든 `switch`는 `assertNever`로 종결
- ID는 브랜드 타입으로 분리 (`type KeyName = Brand<string, "KeyName">`)

### 3. 데이터 경계
- 외부 입력 (CSV, fetch, URL, localStorage) → Zod 스키마로 검증
- 내부 데이터는 plain `type` with `readonly`
- 배열은 `readonly T[]` 기본
- 객체 속성은 `readonly` 기본

### 4. 임포트
- Type-only는 `import type`
- 명명된 export만 사용 (`export default` 금지)
- 외부 임포트 → 내부 임포트 순서

### 5. 에러 처리
- 도메인 에러는 Error 서브클래스 (typed fields)
- `throw new Error("문자열")` 금지 (직접 던지는 도메인 에러)
- 예상 가능한 실패는 Result 패턴 (1-2 호출 레벨)

## 도구 강제
- `tsgo --noEmit` (CI)
- `biome check .` (CI)
- `scripts/check-loc.ts` (CI) — 모든 src/test 파일 250 LOC 이하 검증
- `scripts/check-forbidden.ts` (CI) — `as any` 등 패턴 grep

## 예외 없음
이 룰은 테스트 파일, 스크립트 파일, 일회용 코드에도 동일하게 적용된다.
