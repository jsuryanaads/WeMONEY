# We MONEY V1 — MASTER PRO Roadmap

## Production safety checkpoints

- `checkpoint/pre-master-pro-20260908` — baseline before MASTER PRO
- `checkpoint/v2-1-dashboard-fix` — UX foundation safety point
- `checkpoint/v2-1-validation-20260908` — validation hardening safety point

## Current roadmap

### V2.1 — UX Foundation
- simplified dashboard hierarchy
- Catat Cepat as primary action
- Photo Catat as secondary flagship
- mobile-first cards and transaction summary
- 44px+ interaction targets
- empty and loading states
- persistent mobile bottom navigation

### V2.2 — Visual Identity
- typography hierarchy
- spacing and card consistency
- iconography and semantic color
- dark mode compatibility
- restrained micro-interaction

### V2.3 — Intelligence
- automatic financial insight
- month-over-month comparison
- spending pattern by category
- insight-driven reports
- budget-awareness extension point

### V2.4 — Polish
- keyboard/focus accessibility
- reduced-motion support
- responsive guardrails
- error and empty states
- production build/deploy validation
- legacy route review

## Rollback rule

Every meaningful milestone is represented by a Git branch checkpoint. If a production regression is found, move `main` back to the last validated checkpoint rather than patching blindly in production.
