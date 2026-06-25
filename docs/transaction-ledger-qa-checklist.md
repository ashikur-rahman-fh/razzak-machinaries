# Transaction Ledger — Manual QA Checklist

## Create transaction
- [ ] Open `/transactions/new` and create INITIAL, SALE, and PAYMENT transactions
- [ ] Open `/customers/{id}/transactions/new` with customer preselected
- [ ] Use shortcut buttons on customer profile: Add Transaction, Record Payment, New Sale
- [ ] SALE: add/remove item rows; line totals and grand total update live
- [ ] Submit disabled when form invalid or while saving
- [ ] Validation errors shown for missing customer, empty sale items, zero amounts

## Customer profile
- [ ] Current baki displayed prominently with breakdown (initial, sales, payments)
- [ ] Recent transactions list shows correct type badges and balance impact colors
- [ ] Balance updates after creating a transaction and returning to profile

## Transaction list
- [ ] `/transactions` lists transactions with customer, type badge, date, amount, impact
- [ ] Filters work: type, date range, search
- [ ] Pagination works on desktop and mobile card layout

## Localization & responsive
- [ ] Switch English/Bangla labels on create form, list, and customer summary
- [ ] Layout usable on mobile viewport (320px+)

## Data integrity (smoke)
- [ ] Customer balance on profile matches sum of transactions (initial + sales - payments)
