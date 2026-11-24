# Debt Ledger

A mobile-first debt tracker for money borrowed from people, built with Vue 3, TypeScript, Vite, Pinia, and Vue Router. It keeps a local ledger, groups debts by person, surfaces upcoming and overdue balances, and exports a JSON backup.

## Run

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm build   # vue-tsc -b && vite build
pnpm test    # Vitest unit tests for debt and money helpers
```

## Screens

- **Home** — count-up outstanding total, quick actions, upcoming and recent debts.
- **Debts** — search, status filters, collapsible groups, per-person totals.
- **Insights** — outstanding share by person, due-date timeline, overdue callout.
- **Profile** — dark/light theme, currency display, JSON export/import.
- **Detail** — a slid-in ledger entry with paid toggle, repay, and delete actions.

Add, repay, and delete flows use drag-dismissible bottom sheets. On phones the navigation is a bottom tab bar; from 600px it becomes a left rail.

## Data

Debts and settings persist in `localStorage` under `debt-ledger:debts` and `debt-ledger:settings`. Exported backups contain `app`, `version`, `settings`, and `debts` fields and can be imported from Profile.

## Structure

```
src/
  components/   shell, sheets, lists, charts, hero
  composables/  count-up, sheet gesture, Three.js scene
  motion/       shared timing presets
  router/       tab and detail routes
  stores/       Pinia state and persistence
  styles/       palette tokens, base, shell
  utils/        debt math, formatting, validation, backups
  views/        Home, Debts, Insights, Profile, Detail
```

See `AGENTS.md` for implementation notes and browser-verification guidance.
# Debt
