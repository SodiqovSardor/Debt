# Agent notes

## Stack & entrypoints
- Vue 3 `<script setup>` SFCs + TypeScript + Vite. Startup chain: `index.html` → `src/main.ts` → `src/App.vue` → `src/components/AppShell.vue`; views live in `src/views/`.
- Pinia stores in `src/stores/` (`debts`, `settings`, `ui`), Vue Router in `src/router/`, pure debt math in `src/utils/debts.ts`, motion presets in `src/motion/presets.ts`.
- Animation uses `motion-v` for Vue transitions, GSAP for count-ups/check draw/donut sweep, and lazy-loaded Three.js for the Home hero. `@vueuse/core` supplies media-query, scroll-lock, and event helpers; icons are `lucide-vue-next`.
- Styles are split into `src/styles/tokens.css` (locked palette + light theme), `base.css`, and `shell.css` (shell, components, responsive rules). Import them through `src/style.css`.
- Files served by absolute URL (for example `/favicon.svg`) belong in `public/`; assets imported from code belong in `src/assets/`.

## Commands
- Use **pnpm** (`pnpm-lock.yaml` is the only lockfile; no npm/yarn lock).
- `pnpm dev` — dev server.
- `pnpm build` — required verification gate: `vue-tsc -b && vite build`.
- `pnpm preview` — serve the production build.
- `pnpm test` — Vitest unit tests for pure debt/format behaviour.
- `pnpm test:watch` — Vitest watch mode.
- Types alone: `pnpm exec vue-tsc -b`.
- No lint or format scripts exist. Don't invent `pnpm lint`.

## Build/TS quirks
- Root `tsconfig.json` is references-only: `tsconfig.app.json` covers `src/**/*.{ts,tsx,vue}` (DOM, `vite/client` types), `tsconfig.node.json` covers `vite.config.ts` (Node types, nodenext). `vite.config.ts` changes are typechecked by the same `-b` build.
- `noUnusedLocals` and `noUnusedParameters` are on in both configs — unused code fails the build.
- `pnpm build` warns that the lazy Three chunk exceeds 500 KB. That is expected; Three is a separate dynamic import and the main JS budget applies without it.
- Vitest tests live beside the utility under test (`src/utils/debts.test.ts`); add new pure-math tests there rather than introducing a test runner.

## Data & persistence
- `useDebtsStore` owns debt CRUD/getters and persists as `debt-ledger:debts`; `useSettingsStore` persists theme and currency as `debt-ledger:settings`. The plugin in `src/stores/persist.ts` hydrates before first render and discards corrupt entries.
- `src/utils/debts.ts` is the only place for totals, grouping, sorting, overdue/due-soon, search, and filter logic. Keep components thin and test this layer.
- Backups are JSON files with `app: "debt-ledger"`, `version: 1`, `settings`, and `debts`; `src/utils/backup.ts` validates imports and replaces the current ledger. Keep the backup shape stable.
- Partial repayments and scheduled reminders are intentionally next-stage; search/filtering, due dates, and the repay entry point are wired today.

## Routes, sheets, and keys
- Routes: `/` (Home), `/debts`, `/debts/:id` (detail), `/insights`, `/profile`. Detail routes set `meta.detail` so `AppShell` slides them in from the right.
- `src/components/AppShell.vue` owns route transitions and the add/repay/delete sheets. Global keys: `n` opens Add, `/` focuses debt search, `Esc` closes any sheet.
- `BottomSheet.vue` handles focus restore, body scroll lock, and drag-to-dismiss through `useSheetGesture` (dismiss past 40% of the panel height). Only the handle starts a drag so sheet content stays scrollable.
- Keep haptics on add and paid toggles via `src/utils/haptics.ts` (`navigator.vibrate?.(10)`).

## Motion & Three
- Tune timing in `src/motion/presets.ts` only: tab spring, sheet spring, 180ms tab fade, 24px/260ms route slide, 40ms/320ms stagger, 900ms `expo.out` count-up, 350ms check draw, donut sweep.
- `MotionConfig reduced-motion="user"` handles declarative motion. Count-up, check draw, donut, and Three also check reduced motion explicitly; reduced motion keeps opacity fades but removes transforms, springs, and count-ups.
- The hero dynamically imports Three, caps pixel ratio at 2, uses one light plus ambient, pauses off-screen/hidden, and disposes GPU resources on unmount. It is skipped for reduced motion, `hardwareConcurrency <= 4`, or `deviceMemory <= 4`; the CSS gradient remains as fallback. Don't eager-import Three.

## Responsive rules
- Phone `<600px`: bottom tab bar + centered add FAB.
- Tablet `600–1024px`: left rail with a prominent add control at the top. Home uses a single readable column until the page container reaches 600px, then two columns (so 768px tablets get the two-column dashboard).
- Desktop `≥1024px`: wider labeled rail, 960px content column, and the debt table header/columns at container ≥640px.
- Layout uses container queries on `.page` and `.debt-table`; the Home side lists use a `home-side` container to drop notes before names truncate. Keep hover styles inside `(hover: hover) and (pointer: fine)` and targets at least 48px under coarse pointers.
- Accessibility: 2px terracotta focus outline at 3px offset, AA contrast in both themes, labelled dialogs/lists/controls, and reduced-motion fallbacks. Preserve these when adding components.

## Verification notes
- The repo is not a git repository and has no CI/pre-commit hooks.
- `pnpm build` + `pnpm test` are the local gates. Browser checks are run outside the repo with Playwright; do not add Playwright or its browser download to project dependencies unless the task explicitly asks for e2e coverage.
