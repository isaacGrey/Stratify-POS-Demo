# StratifyPOS â€” Interactive Portfolio Demo

This is a **standalone, browser-only demonstration** of StratifyPOS, built with React, TypeScript, and Vite. It is intended for public portfolio use and Vercel deployment.

This repository was intentionally created with its own history. It **does not include** the production POS application, backend, migrations, database schema, secrets, or git history.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@demo.stratifypos.app | demo1234 |
| Manager | manager@demo.stratifypos.app | demo1234 |
| Cashier | cashier@demo.stratifypos.app | demo1234 |

These are **public sample account selectors**, not real authentication credentials. There is no server, API, remote DB, or real payment processing.

## Demo features

Interactive sample POS checkout, role-based navigation, inventory stock updates, product editing, order history, reports, CSV export, sample branches, and local attendance.

All changes are stored in the visitor's own browser localStorage and can be reset. Receipt views are simulated and **not fiscal invoices**.

## Local

```bash
npm install
npm run dev
npm run build
```

## Vercel

Import this repository in Vercel, with **Root Directory: .**, Framework: Vite, Build: `npm run build`, Output: `dist`. No environment variables are required.

The production code should remain in a **different, private** repository.