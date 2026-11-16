# StratifyPOS — interactive multi-industry portfolio demo

**Browser-only simulated showcase. No real customer data, payment processing, production API, or financial records.** Designed for portfolio evaluation and Vercel hosting. It is deliberately separate from the production StratifyPOS repository.

## Try the demo

Use any public role selector below, all with password `demo1234`:

| Role | Email | Demo privileges |
| --- | --- | --- |
| Owner | owner@demo.stratifypos.app | All demonstration workflows |
| Manager | manager@demo.stratifypos.app | Management and operational modules |
| Cashier | cashier@demo.stratifypos.app | Checkout, orders, register, attendance, kitchen |

All passwords are **display-only demonstration selectors**, not real authentication. Changing the account changes available navigation. Never enter personal, payment, clinical or confidential data into a public demo.

## Interactive workflows

- **POS checkout:** Product and service sale, discount, simulated payment method, printed-style sample receipt, branch stock decrement, linked kitchen ticket, cashier drawer impact.
- **Catalog:** Add and edit products and service items, SKU/barcode fields, classifications, prices and inactive state.
- **Inventory:** Branch-specific balances, stock adjustments, recorded stock transfers and movement history, no negative source balances.
- **Purchasing:** Add suppliers, create purchase orders, receive partial quantities and update destination inventory.
- **Service memberships:** Add customers, define service plans, issue/renew/cancel grants, expiry presets (1/2/3/6/12/24 months; 7/30 days), custom date and lifetime entitlements with event history.
- **Cash registers:** Open a cashier drawer with starting cash, post cash movements, inspect variances on closing.
- **QR and kitchen:** Submit a sample table request (initially unpaid), explicitly confirm simulated payment, process kitchen tickets through four states.
- **Refunds and reports:** Record simulated cash refunds, review transactions and download a local CSV.
- **Attendance, locations, settings:** Exercise existing sample team and business settings workflows.

The demo approximates the workflow and data invariants of the current **Development** branch; it is not equivalent to production code and it does not certify that all production features are complete. In particular: no payment gateway, actual customer QR token security, hardware integration, BIR-compliant invoices, automatic recurring billing, real database persistence, or regulated medical records. A second user or device will not share your sample changes.

## Running locally

```bash
npm ci
npm run test
npm run build
npm run dev
```

## Vercel

Use this repository, Root Directory `.`, Vite framework, Build Command `npm run build`, Output Directory `dist`. No environment variables are needed. Pushes deploy automatically if your Vercel project is connected to this repository.

The state is stored in browser localStorage. Use **Reset demo** to restore initial sample records. Do not use this demo to process actual customers, merchandise, business payments or sensitive information.
