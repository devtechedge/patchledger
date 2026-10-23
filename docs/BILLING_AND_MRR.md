# Billing & MRR Path

Updated: 2026-10-24. Nothing here is revenue; the product has zero customers.

## Plans (implemented as limits in code; billing switch is config)

| Plan | Price | Projects | Extras |
|------|-------|----------|--------|
| Starter | $19/mo | 3 | unlimited imports, shareable reports |
| Studio | $49/mo | 15 | custom branding, SLA tracking |
| Agency | $99/mo | 50 | evidence exports, priority support |

Annual = 10x monthly (2 months free). Pilot offer (unapproved draft): first 5 agencies get 50% for 3 months in exchange for a 20-minute feedback call.

## Bottom-up path to $2,000 MRR (targets to validate, NOT a forecast)

8 Agency x $99 = $792; 14 Studio x $49 = $686; 27 Starter x $19 = $513. Total $1,991/mo from 49 accounts.

Sequence assumptions (each to be tested):
- Weeks 1-2: 25-40 outreach -> 8+ qualified conversations -> 3 paid pilots.
- Month 2: 10 paying (communities + directories + referrals from pilots).
- Months 3-5: ~3.5% monthly lead-to-paid on growing funnel, low early churn, reaching 49 accounts.
Churn risk specific to this product: if a client relationship ends, that project goes; multiple projects per account is the retention lever.

## Payment provider (verified 2026-10-24 from official docs)

Constraint: founder is India-based, selling to US/UK/EU. VERIFIED: Lemon Squeezy fees are 5% + 50c per transaction, $0/mo, and as Merchant of Record it "takes on the liability of tax collection and calculation and pays taxes on your behalf" (global VAT + sales tax included). India: LS docs state bank payouts need Stripe pre-approval because "from May 2024, Stripe only accepts new accounts from India on an invite-only basis"; the supported route for India is PayPal payouts (200+ countries; PayPal's own docs confirm India can receive/withdraw INR). Decision: Lemon Squeezy with PayPal payouts is the billing path when a pilot asks to pay; checkout + webhook unbuilt by design until then. Sources: lemonsqueezy.com/pricing, docs.lemonsqueezy.com/help/getting-started/supported-countries + /getting-paid, developer.paypal.com/payouts/supported-features (all checked 2026-10-24).

## Metrics to track from day 1

Conversations, qualified conversations, pilots, paying accounts (by plan), MRR (monthly-normalized; annual = 1/12 per month; one-offs never counted), logo churn, revenue churn, infra cost (Neon + Vercel free tiers today: $0), AI/API cost (none - no AI in path).
