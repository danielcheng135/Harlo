# Harlo Implementation Plan

## Billing Automation
- Implemented a protected scheduled credit monitor at `/api/cron/credit-monitor`, configured to run daily on Vercel. It checks active/trialing organizations for both 80% low-credit warnings and hard credit limits, skips low-credit emails when auto-recharge credits are enabled, sends the branded billing alert email without waiting for the next customer message, and keeps separate 24-hour per-organization throttles for low-credit and limit alerts. The dashboard/sidebar now also warn at 80% and 100%. Production needs `CRON_SECRET` configured.

## Credit Accounting
- Plan credits reset every monthly credit period, including annual subscriptions.
- Auto-recharge credits are stored as separate `credit_grants` that expire one month after the recharge date. Plan resets do not wipe unexpired add-on credits.
- Assistant message usage consumes plan credits first, then the oldest expiring add-on credit grants. `credit_grant_usages` records which grant paid for overage usage.


## Billing Add-ons
- Billing add-ons are managed through `/api/billing/add-ons` and stored in `organization_add_ons`.
- Extra agents, extra seats, and remove-branding now sync as Stripe subscription items on the active subscription. The webhook resolves the main plan from the subscription's plan item so add-on items do not overwrite the workspace plan.
- Auto-recharge remains a usage protection add-on: it enables off-session recharge payments when credits run out instead of adding a recurring subscription item.

## Auto-Recharge
- Implemented the auto-recharge add-on toggle in Billing with `/api/billing/add-ons`.
- When the chatbot is out of credits and auto-recharge is enabled, Harlo attempts a $29 off-session Stripe charge, creates a 1,000-credit grant on success, and then continues the reply flow.
- Stripe payment intents use an idempotency key, and `credit_grants` enforces one grant per payment intent to avoid duplicate recharge credits.
- Implemented Billing page credit transparency: plan credits, add-on credits used, active add-on credits available, and expiration dates for recharge grants. Implemented dedicated auto-recharge failure emails, failure metadata tracking, and a dashboard warning when a recharge attempt fails.

## Overview Redesign
- Implemented: rebuilt the Overview page as the main command center with a cleaner modern SaaS layout, richer live widget preview, clearer usage/billing state, recent conversation/lead summaries, outcome tracking, and knowledge health that matches the final Harlo visual system.

## Team and Capacity
- Added seat and agent capacity accounting from the active plan plus add-on quantities.
- Billing now shows agent and seat usage, including pending invitations that reserve seats.
- Extra seat and extra agent add-ons cannot be reduced below current workspace usage.
- Added a Team page with member list, seat-aware invite creation, pending invite links, and invite acceptance for signed-in users.
