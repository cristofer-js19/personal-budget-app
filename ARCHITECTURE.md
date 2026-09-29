# Architecture & Versioning Baseline

This document specifies the verified runtime environment, framework patterns, and architectural rules enforced across the **Personal Budget App**, complying with **Context-Aware Versioning (Global Rule 2)**.

## Verified Environment

- **Runtime**: Node.js `>= 20.0.0` (Active environment: Node 24 LTS)
- **Framework**: Next.js `16.3.5` (App Router, Turbopack, React 19 Client Components)
- **UI & State**: React `19.2.8`, React DOM `19.2.8`
- **TypeScript**: `^5.0.0` with strict type checking
- **Data Persistence & Auth**: Supabase PostgreSQL with `@supabase/ssr: ^0.12.7` & `@supabase/supabase-js: ^2.116.0`
- **Monetary Arithmetic**: `big.js: ^7.0.1` (arbitrary-precision decimal arithmetic)
- **Testing**: Vitest `^5.0.2`

## Architectural Guidelines

1. **Destructive Action Safeguards (Global Rule 1)**:
   - Physical data deletions (`DELETE FROM ...`) are prohibited in the standard application workflow.
   - Deletions are implemented via **Soft Delete** (`deleted_at TIMESTAMPTZ`), allowing auditability and non-destructive data recovery.

2. **Context-Aware Versioning (Global Rule 2)**:
   - Supabase client integration in the browser uses `@supabase/ssr` (`createBrowserClient`) instead of legacy standalone client methods.
   - All monetary calculations must use `Big.js` rather than native JavaScript numbers (`0.1 + 0.2` rounding hazards).

3. **Source-Level Security (Global Rule 3)**:
   - Financial constraints are anchored directly in the PostgreSQL schema:
     - `amount <> 0`
     - `type = 'income'` requires `amount > 0`
     - `type = 'expense'` requires `amount < 0`
   - Row-Level Security (RLS) policies wrap `auth.uid()` in `(SELECT auth.uid())` for cached query execution.
   - `SECURITY DEFINER` functions enforce `SET search_path = ''` to prevent search path injection.
