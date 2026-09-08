# We MONEY — Verified Budget Schema

Verified against the connected production Supabase project on 2026-09-09.

## `public.budgets`

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | no | gen_random_uuid() |
| user_id | uuid | no | — |
| category_id | uuid | yes | — |
| name | text | no | — |
| amount | numeric | no | — |
| period | text | no | monthly |
| start_date | date | no | current_date |
| end_date | date | yes | — |
| is_active | boolean | no | true |
| created_at | timestamptz | no | now() |
| updated_at | timestamptz | no | now() |

## Constraints

- `id` primary key.
- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`.
- `category_id` references `categories(id)` with `ON DELETE SET NULL`.
- `amount >= 0`.
- `period` is one of `weekly`, `monthly`, `yearly`.

## Security

RLS is enabled. Existing policies restrict select/insert/update/delete to rows where `user_id = auth.uid()`.

A database trigger also verifies that a non-null `category_id` belongs to the same user, is active, and is an expense category.

## Reporting semantics

- `category_id IS NULL` means a total/general budget.
- A non-null `category_id` means the budget applies only to expense transactions in that category.
- Actual spending is calculated from `transactions.type = 'expense'` and `transaction_date` inside the budget period.
- Transfers and income are never counted as budget spending.
