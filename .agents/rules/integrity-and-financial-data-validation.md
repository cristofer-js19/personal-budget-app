---
trigger: always_on
---

Any logic involving monetary values must:

- Use `Decimal` (Python) or `big.js` / `decimal.js` (JS/TS) instead of `float` or native `number` to avoid rounding errors in financial calculations.
- Validate and reject negative inputs in revenue fields, and positive inputs in expense fields, unless the domain explicitly allows them.
- Never display financial values without currency formatting (e.g., `R$ 1,250.00`), respecting the `pt-BR` locale.
- Include unit tests for any calculation function (balance, category total, monthly projection).
