---
trigger: always_on
---

Since this is an application that handles sensitive personal financial data:

- Never log, print, or expose transaction amounts, balances, or user data using `console.log`, `print`, or log files in a production environment.
- Financial data must not be stored in `localStorage` or `sessionStorage` without encryption.
- All communication with external APIs must use HTTPS and include explicit handling of authentication errors (401/403).
- When generating seeds, mocks, or test data, use only fictitious values — never reuse or hardcode real user data in the code.
