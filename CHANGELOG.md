# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial scaffolding for 변기톤 오푸스 통계 dashboard.
- Ultra-strict TypeScript config (`strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`).
- Biome formatter/linter with `noExplicitAny` and `noNonNullAssertion` enforced.
- Cloudflare Workers + R2 architecture.
- CSV parser, loader, and aggregation utilities.
- Responsive analytics UI (overview / keys / models / hourly).
- Manual QA via Playwright headless browser.
- Lighthouse-driven optimization loop.

## [0.1.0] - 2026-05-19

Initial release. End-to-end build via Oh My OpenAgent.
