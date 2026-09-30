---
description: Checks typing, aesthetics, quality, and code build before committing changes
---

Steps:

1. Syntax & Type Checking: Run npm run build or npx tsc --noEmit. Do not ignore type errors.
2. Linting & Style:

- Run the project's Linter to ensure code quality.
- Run Prettier on the project to ensure code formatting.

3. Change Summary: Identify whether there was a significant addition [I], removal [R], or alteration [A] to the business logic.

Acceptance Criteria:

- Zero ESLint errors.
- Zero Prettier errors.
- 100% valid TypeScript typing.
- Next.js build completes without critical warnings.
