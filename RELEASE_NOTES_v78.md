# Gringotts Budget Vault v78

## Focus

Debt Planner II + Promo APR Integration.

## Changes

- Debt Planner now reads Promo APR balances from Promo APR Watch.
- Debt summary now shows manual debt, promo APR balances, combined exposure, promo payoff target total, and priority guidance.
- Added Promo APR payoff focus inside the Debt tab.
- Promo balances are sorted by urgency and show payoff target per month, promo end date, days remaining, and regular APR.
- Quota-safe storage remains in place; this release writes only the small debt/promo planner keys, not another full transaction-vault copy.

## Test

1. Add or confirm a Promo APR balance with a 2027 promo end date.
2. Open Debt.
3. Confirm Promo APR payoff focus appears.
4. Confirm the target monthly payoff is calculated.
5. Confirm Health and Repair still show v78 / populated latest vault after refresh.
