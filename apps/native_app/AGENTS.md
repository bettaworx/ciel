# Native App AGENTS Guide

This document provides guidelines for working on the Ciel native app (`apps/native_app`).

## Positioning and Shared Principles

The native app is part of the same Ciel product as the web frontend. Reuse frontend conventions where reasonable:

- Keep UX and terminology consistent with `apps/frontend`
- Prioritize type safety and predictable state transitions
- Respect i18n from the start (Japanese/English)
- Keep components small, testable, and composable

When implementation details differ between platforms, keep behavior consistent even if the underlying widget/API differs.

## Design Direction (Important)

### Flat Design First

The native app should follow a **flat design** language.

- Avoid Material You-like visual expression by default
- Avoid heavy elevation, layered shadows, and glossy/3D effects
- Use spacing, typography, and contrast for hierarchy
- Prefer simple surfaces, clear borders, and restrained accents

In short: **do not optimize for “Material Youらしさ”; optimize for Ciel’s flat, minimal UI consistency with frontend**.

## UI Consistency Rules

- Keep visual rhythm (spacing, radius, density) coherent across screens
- Use shared semantic naming for colors/tokens where possible
- Do not hardcode one-off colors repeatedly; centralize tokens/theme values
- Prefer reusable UI primitives over ad-hoc per-screen styling

## Architecture Guidance

- Separate UI, domain logic, and data access layers
- Isolate side effects (network/storage) behind abstractions
- Keep state explicit and testable
- Avoid global mutable state unless clearly justified

## API and Data Contracts

- Treat OpenAPI as source of truth for backend contract
- Keep request/response models aligned with generated types or schema-based models
- Handle error codes explicitly and map to user-friendly messages

## i18n

- All user-facing strings must go through localization resources
- Never embed long user-facing copy directly in widgets/views
- Keep translation keys stable and descriptive

## Security and Privacy

- Do not log secrets/tokens/PII
- Use secure storage for sensitive credentials
- Validate external inputs and deep links before use
- Fail safely on malformed or missing data

## Testing Expectations

- Add/update tests when changing behavior
- Prefer fast unit/widget tests for logic and UI states
- Add integration tests for critical flows (auth, posting, timeline)

## Reference

For shared product context and web patterns, see:

- Repository root guide: `AGENTS.md`
- Frontend guide: `apps/frontend/AGENTS.md`
