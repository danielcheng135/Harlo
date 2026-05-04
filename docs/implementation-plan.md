# Harlo Implementation Plan

## Billing Automation
- Add a scheduled credit monitor that runs by cron, checks organizations at or over their credit limit, sends the billing alert email without waiting for the next customer message, and keeps the existing 24-hour per-organization throttle.
