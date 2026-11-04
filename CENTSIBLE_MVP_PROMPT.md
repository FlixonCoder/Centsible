# CENTSIBLE MVP: Implementation Prompt for Antigravity

Attach with this prompt: `centsible-seed/priya.json`, `centsible-seed/arjun.json`, and the existing repo (`centsible/`).
Work in phases. After each phase: run `npm test`, `npm run build`, summarise what changed, then continue. State assumptions inline; do not stop to ask questions.

---

## 0. What we are doing and why

The current repo is a **7-step pitch wizard**: one client-side hook (`usePipeline`) holds all state, nothing persists, the "pipeline" runs on fake timers, the persona is a hard-coded constant, and `/api/chat` falls back to Priya's numbers (`income = 45000`, etc.) if context is missing. That is a demo script, not a product.

We are converting it into an **MVP dashboard**: a persistent app where a user's money data lives in a database, every number is **derived from their transactions and obligations**, and the "emergency decision" is one workflow inside a larger financial-safety dashboard.

**Product in one line:** a lender-neutral "Can I afford this? What will it really cost? Will I survive a bad month?" engine for Indians facing an urgent expense, wrapped in a dashboard people would open weekly, not once.

**Keep from the existing repo** (it is good): `lib/engine/{emi,safeToBorrow,options,stress,mitigation,decide}.ts`, `lib/format.ts`, `tests/engine.test.ts`, Tailwind tokens, `components/ui/primitives.tsx` (review; migrate to shadcn where sensible).
**Delete or replace:** `hooks/usePipeline.ts`, the `app/page.tsx` wizard shell, `components/pipeline/*` fake-timer logic, `components/steps/*` as full-page wizard steps (reuse their visuals inside the new screens), hard-coded defaults in `/api/chat`, and the client-side-only persona store.

Stack stays **Next.js 14 App Router + TypeScript** (frontend and backend in one app). Add: **Prisma + SQLite** (single file DB, zero infra; schema must be Postgres-portable), **zod**, **shadcn/ui**, **TanStack Query**, **Recharts**, **Framer Motion** (restrained), **lucide-react**, **Vitest** (+ Playwright smoke test). Hard constraint: **no local ML models** (dev laptop is RTX 3050 / 4 GB VRAM). All maths is deterministic TypeScript. The assistant uses a hosted LLM only if an env key exists; otherwise a grounded rule-based fallback.

---

## 1. Research findings that drive the design (do not skip; they explain the choices below)

**Competitor UI patterns that work**
- **CRED**: premium dark theme, minimal single-purpose screens, due-date reminders and credit score front and centre. Weakness (UX audits): animation and gamification slow down users who just want to finish a task. *Decision: calm, fast, no gamified friction; every task completes in few taps.*
- **Money View / Walnut / Axio**: auto-categorised expense tracking, bill reminders, loan upsell. Weakness: once lending is bolted on, the experience gets cluttered and the app's incentives shift toward selling loans. *Decision: strictly lender-neutral; no ads; no referral links in MVP. This incentive alignment is our wedge.*
- **Monarch / Copilot / Quicken Simplifi / PocketGuard**: one headline "what's safe to spend" number, a cash-flow page with forecast, recurring-bill calendar, clean category breakdowns. Copilot is praised for UI but weak on projections for irregular income. *Decision: our headline number is **Safe-to-Borrow**; we ship a forward cash-flow forecast; we handle variable income properly (typical month vs weak month).*
- **Cleo**: chat-first, tone modes, opt-in "roast" mode; their chat pillars are intelligence, honesty, empathy, humour. Weakness: monetised via advances. *Decision: chat is a **secondary drawer**, never the primary UI; tone defaults to calm; no shaming language.*

**What nobody in the market does (our gap):** a *pre-decision* tool that compares the true cost of every way of paying (card minimum, BNPL, card EMI, personal loan), is aware of Indian products (BNPL, card EMI conversion, GST on fees, 42% revolve APR), stress-tests the decision, and finds cash to free up.

**Feasibility facts to respect in the build**
1. **Account Aggregator**: per Sahamati's onboarding page, only entities regulated by RBI/SEBI/IRDAI/PFRDA can be FIUs, so Centsible cannot pull AA data directly as an unregulated startup. It needs a regulated partner (the deck already says "through a regulated partner"). Setu and Finvu both offer sandboxes. *MVP data modes are therefore: seeded sample data, manual entry, and CSV statement import, behind a `DataProvider` interface so an AA provider can be dropped in later.*
2. **DPDP**: the Rules were notified 13 Nov 2025; the consent-manager rule takes effect Nov 2026 and the main obligations in May 2027. *Build consent-first now: purpose-stamped consent records, revoke, export, delete.*
3. **Rates are not live quotes.** Calibration points found: Money View personal loans advertise roughly 16–24% p.a.; one mainstream instant-loan example shows 33% p.a. with a ~44% APR after fees; Indian credit-card revolve is ~42% (3.5%/month). All option pricing must be labelled **Illustrative** until a partner rate feed exists.
4. This is **decision support, not licensed advice**. Every decision screen carries a disclaimer; the owner should get the wording reviewed by a lawyer before public launch.

---

## 2. Findings that change the logic (implement these; they make the product honest)

These come from running our own sample numbers through the existing engine:

1. **Eligibility is not optional.** Priya's ZenPay BNPL limit is ₹30,000 with ₹24,000 used, so a ₹40,000 BNPL option is **not available to her**. Her card has ₹1,11,800 free limit, so card EMI **is** available. Each option needs an `eligibility` field (`available | limited | unlikely`) with a reason. Unavailable options still show their cost (educational) but greyed with "Not available to you: only ₹6,000 limit left".
2. **Priya's loan price is probably not 16%.** Her dues-to-income ratio is 24,500/45,000 = **54%**, and 62.5% after the new EMI. Lenders commonly apply an obligations-to-income cap (assume 55%, make it a config constant `FOIR_CAP`, flag "verify with lending partner"). Price each loan archetype as a **range** (best / expected / pessimistic) by credit-score band and FOIR, headline on *expected*, keep the deck's 16% as "best case".
   Reference maths for ₹40,000 / 12 months: 16% → EMI ₹3,629; 24% → ₹3,782; 30% → ₹3,899. Even at 30% the EMI stays under her ₹4,500 limit; she only breaks the limit above ~59% APR. **Surface this "break-even APR"**: it turns rate uncertainty into a reassuring fact.
3. **Dues roll off, and that changes the stress test.** Priya's obligations are not constant: BNPL orders end after 2/3/4 months, the phone EMI after 3, and the card (₹38,200 at 3.5%/month with ₹11,500 payments) clears in 4 months. Dues by month: **₹24,500 → 24,500 → 20,000 → 8,364 → 0**. Safe capacity opens to ₹9,000 in month 3, ~₹20,600 in month 4 and ~₹29,000 from month 5. The hard window is **months 1–3**, not 12. Model every obligation with `remainingMonths` and amortise revolving balances.
4. **A binary SAFE/RISKY verdict is too crude.** With the ₹40,000 loan and a 20% income drop, Priya is already negative *before* the new EMI (−₹2,500). Use four verdicts, defined on a roll-off-aware shock test:
   - `SAFE`: EMI ≤ Safe-to-Borrow **and** survives the shock.
   - `SAFE_WITH_PLAN`: EMI within limit, fails the shock alone, but **survives once the accepted mitigation plan is applied**.
   - `TIGHT`: within limit, fails the shock even with the plan.
   - `RISKY`: EMI exceeds Safe-to-Borrow.
   *Shock pass* = peak cumulative shortfall during the stress window ≤ cushion, where cushion = safety buffer + liquid cash not earmarked for the emergency. Expected for Priya (≈, ₹40,000, 12m, 20% drop): without plan the peak shortfall is ~₹14,000 vs cushion ₹6,350 (fails); with the ~₹3,283/month plan it is ~₹5,700–6,000 (passes) → **`SAFE_WITH_PLAN`**. That is the honest story: *"Borrow, but only with the savings plan, and prepay once your dues roll off."*
5. **Prepayment is the real money-saver.** After 3 EMIs on the loan Priya owes ≈₹30,586; her dues then collapse. The decision screen should show "prepay in month 4 → interest saved ≈ ₹X" computed by the engine, with the loan archetype's foreclosure rule as a parameter.
6. **Lumpy spending is real.** Priya's one-off costs (college fee, insurance, vehicle) average ~₹3,000/month over 6 months, above her ₹2,000 buffer. Keep the default buffer at ₹2,000 (deck parity) but show an insight: "Your irregular spends average ₹3,000/month: consider a ₹3,000 buffer" with a one-tap switch to **Conservative mode** (buffer from data).
7. **Variable income** (Arjun): show both numbers: *typical month* (average) and *weak month* (25th percentile). Priya's/Arjun's deck figures use the average; the engine's `incomeBasis` setting defaults to `average` for salaried and shows both for gig users.
8. **Numbers vs deck.** Derived mitigation for Priya is ≈₹3,283/month (delivery −1,200, cabs→metro −700, two flagged subscriptions −583, shopping cap −800), not exactly ₹3,400; "saves ≈₹26,000 vs card-minimum" holds at 16% but is ≈₹24,000 at a 24% expected rate. The app must show the derived numbers. (The owner will update slides to "≈₹3,300" and "₹24–26k".)

---

## 3. Information architecture (dashboard, not wizard)

App shell: **collapsible left sidebar** (desktop), **bottom tab bar** (mobile ≤ 768px; primary users are mobile-first). Top bar: page title, persona/user menu, Calm Mode toggle, "Ask Centsible" button. The app must be fully usable at 390px width.

| Route | Screen | Purpose |
|---|---|---|
| `/login` | Entry | "Continue as Priya / Arjun (sample)" or "Start with my own data" (manual onboarding). Signed httpOnly cookie session (iron-session or jose). Real auth is Phase 2. |
| `/onboarding` | Guided setup | 3 calm question cards (income type, monthly income, what do you owe) → manual entry forms, CSV import, or "use sample data". |
| `/` **Overview** | Home | See §4.1 |
| `/cash-flow` | Transactions + forecast | See §4.2 |
| `/obligations` | All debts and EMIs | See §4.3 |
| `/decision` | Past and active decisions list | History of emergency checks |
| `/decision/new` and `/decision/[id]` | **Decision Lab** (core workflow) | See §4.4 |
| `/savings` | Savings Finder (Mitigation) | See §4.5 |
| `/data` | Data and Consent | Sources, consent records, sync, export, delete |
| `/settings` | Preferences | Buffer, income basis, language stub, tone, FOIR cap (advanced) |
| Drawer | Assistant | Available on every page; `C` shortcut |

### 4.1 Overview
- **Hero card: Safe-to-Borrow** (big number, ring gauge) with a one-line explanation and a "How is this calculated?" popover showing the waterfall (income − dues − living − buffer). Gig users see "₹5,500 typical · ₹2,750 weak month".
- **Strip of 4 stat cards:** Monthly income, Committed dues (with DTI/FOIR %), Living expenses (3-mo avg), Free cash after buffer.
- **"I have an urgent expense" primary button** → `/decision/new`. If an active ExpenseEvent exists (Priya: dental bill due Fri 6 Nov), show it as a prominent banner with days left.
- **Next 30 days timeline:** salary expected (5 Nov), dues by date (6 Nov Bajaj, 9 Nov ZenPay ×3, 12 Nov ICICI), emergency due date. Compact calendar list, not a full calendar.
- **Cash-flow mini chart:** 6 months income vs outflow (Recharts).
- **Insights feed (max 3 visible):** severity-ranked, each with a CTA (e.g., "Dues drop to ₹20,000 in January", "2 subscriptions you flagged as rarely used cost ₹583/month").

### 4.2 Cash Flow
- Transactions table (search, month filter, category filter, **inline recategorise** with "apply to similar" rule creation), badges for recurring/flexible/one-off.
- Month category bars + 6-month trend; recurring-payments list (auto-detected: same merchant, ~monthly, similar amount).
- **Forecast chart (12 months):** projected balance using income, roll-off-aware obligations and baseline living spend; shaded band for weak-income scenario.

### 4.3 Obligations
- Table: lender, type (credit card / BNPL / consumer EMI / loan), monthly amount, APR, remaining months, outstanding, next due, "matched to bank debit ✓/✗".
- **Roll-off timeline chart** (stacked bars by month, dues falling to 0). Headline: "You'll be debt-free of current dues by March 2027" (derived).
- **Payoff order suggestion** (avalanche: highest APR first) with interest saved if extra cash is applied.

### 4.4 Decision Lab (the heart of the product; the old wizard lives here, properly)
Route `/decision/new` → creates an `ExpenseEvent`. Layout: **top horizontal stepper** (Expense → Savings → Capacity → Options → Stress → Plan → Verdict) and a **right-hand "Decision Trace" panel** (this replaces the old left pipeline; keep the visual-flow concept as an *audit trail*).
- **Decision Trace panel:** a vertical list of computed stages. Each shows: stage name, status (done / warning), **real compute duration** from the API (no artificial delays), and an expandable **Inputs → Formula → Output** view with actual values. This is the explainability / trust feature, and what a judge will want to click.
- **Step 1 Expense:** title, amount, due date, category, urgency, "can it be delayed?", "has the provider offered instalments?" (Calm Guided Mode = question cards; Priya's event is prefilled).
- **Step 2 Savings:** slider for how much of earmarked savings to apply (0 – earmarked); credit gap updates live; warns if applying more than earmarked.
- **Step 3 Capacity:** Safe-to-Borrow waterfall; "Lender may approve ₹X vs you can safely carry ₹Y"; FOIR before/after.
- **Step 4 Options:** cards for the 4 deck options **plus** non-loan alternatives (use more savings, ask provider for staged payment, family loan at 0%, delay if allowed). Each card: monthly payment, tenure, total repaid, extra cost, eligibility chip, verdict chip, **rate range** (best / expected / pessimistic) and **break-even APR**. "Show the math" drawer lists every assumption and fee (GST on fees at 18%). Labelled *Illustrative rates*.
- **Step 5 Stress:** income-drop slider (0–40%, default 20%), scenario chips (income −20%, job gap 1 month, second surprise expense ₹10,000), roll-off-aware 12-month chart, banner with the verdict-tier reasoning.
- **Step 6 Plan:** pulls in Savings Finder suggestions with toggles; **live before/after** of Safe-to-Borrow, shock result, and prepayment impact. Only *accepted* actions change the verdict.
- **Step 7 Verdict:** recommendation card (tier chip, chosen option, three plain-language reasons), hero stat "smarter choice saves ≈ ₹X vs card minimum" (derived, shows range for rate uncertainty), prepayment suggestion with interest saved, and a **3-step action list** (what to do this week). Buttons: **Save decision** (persists snapshot of inputs, outputs, trace) and **Export summary (PDF/print view)**. Footer: "Centsible is decision support. We don't lend and take no loan commissions."
- Saved decisions can be reopened read-only with the exact numbers at that time, and a "re-run with today's data" button.

### 4.5 Savings Finder (the Mitigation Layer, expanded)
Evidence-backed suggestions from the user's own transactions; each card shows **monthly saving, effort (easy/medium), confidence, and the evidence** ("14 delivery orders in October, ₹2,200"; click to see the transactions). Status: `suggested → accepted → dismissed → achieved`. Accepted actions become a **Plan**, with target vs actual tracking by month. Tone: encouraging, never shaming. Detectors (all deterministic, in `lib/engine/mitigation/`):
1. **Subscriptions:** recurring same-merchant debits; cancel/pause candidates are those the user flagged `rarely_used` (we cannot see app usage; do not pretend to). Priya: JioHotstar ₹149 + FitNest ₹434 = ₹583.
2. **Food delivery frequency/trend** vs 3-month average; suggested cut = reduce to a target frequency (Priya: ₹2,200 → ~₹1,000, −₹1,200).
3. **Cab → metro/bus substitution:** cab spend with a metro/bus alternative present in the data (Priya: −₹700).
4. **Category cap** for flagged discretionary categories (shopping ₹2,800 → ₹2,000, −₹800).
5. **Debt tip (informational):** pay the highest-APR balance first (ICICI card, 42%); compute interest saved.
6. **Emergency-fund builder:** route X% of freed cash to a goal; show months to reach a target (e.g., 1 month of dues + living).
Total freed and the effect on Safe-to-Borrow are computed live. **Freed cash only counts toward the verdict once the action is accepted.**

### 4.6 Data and Consent
Source list (bank, card, BNPL, EMI) with last-synced time and status; **"Connect with Account Aggregator (simulated)"** flow that mimics consent request → approve → data fetched (clearly labelled *Simulation, no real data leaves your device*). Show each `ConsentRecord`: purpose, data types, date range, expiry, **Revoke**. Buttons: **Export my data (JSON)** and **Delete my account and data**.

### 4.7 Assistant (drawer)
See §7.

---

## 4. Visual design system

Match the deck (navy/indigo + lavender) but evolve for a product.
- Light theme default; dark theme optional via `prefers-color-scheme` + toggle. Background `#F7F8FC`, cards white, 16px radius, 1px border `#E8EAF3`, soft shadow. Primary deep indigo `#2B2A6E`, accent `#4F46E5`, purple `#7C3AED`. Semantic: safe green `#16A34A`, caution amber `#D97706`, risk red `#DC2626`, each with a tint background. **Never rely on colour alone**: pair with icon + label.
- Font: Plus Jakarta Sans or Inter via `next/font`; tabular numerals for money; `formatINR()` everywhere (en-IN grouping, `₹`).
- Layout: 12-col grid, max content width ~1280px, generous whitespace; **one focal point per screen**, ≤ 3 supporting elements above the fold.
- Motion: count-up on key numbers, 150–250ms transitions, skeletons while loading, `prefers-reduced-motion` respected. No decorative loops.
- Empty states, loading skeletons, and error states for **every** data view (no blank panels).
- Calm Mode: softer palette, larger type, hides non-essential charts, rewrites copy to be extra gentle.
- Accessibility: WCAG AA contrast, keyboard navigable, focus rings, aria labels on charts (provide a table fallback toggle).
- Currency in inputs: numeric keypad on mobile, thousands separators as you type.

---

## 5. Data model (Prisma, SQLite; string fields + zod validation instead of DB enums for portability)

- `User` (id, name, age, city, occupation, incomeType `salaried|gig|freelance`, language, tone, incomeBasis, bufferAmount, bufferMode `fixed|data`, createdAt)
- `Account` (userId, type `savings|credit_card|bnpl|loan`, institution, name, mask, balance, limit, outstanding, apr, dueDay, earmarkedEmergencySavings, provider `seed|manual|csv|aa`, lastSyncedAt)
- `Transaction` (accountId, date, time, amount signed, channel, narration, merchant, category, subcategory, isRecurring, isFlexible, userFlag, categorySource `rule|user|import`, balanceAfter)
- `CategoryRule` (userId, matchType, pattern, category, subcategory), created from inline recategorisation
- `Obligation` (userId, accountId, kind `credit_card_revolving|bnpl_order|consumer_emi|loan`, name, monthlyAmount, outstanding, apr, dueDay, remainingMonths nullable, matchedToBank boolean)
- `ExpenseEvent` (userId, title, provider, category, amount, due, urgency, canDelay, providerOffersInstalments, status)
- `Decision` (eventId, createdAt, inputsJson, resultJson, traceJson, selectedOptionId, verdict, engineVersion)
- `PlanAction` (userId, decisionId nullable, type, title, monthlyImpact, status, evidenceTxnIds, acceptedAt)
- `ConsentRecord` (userId, sourceId, purpose, dataTypes, fromDate, toDate, grantedAt, expiresAt, revokedAt)
- `ChatMessage` (userId, role, content, toolCallsJson, createdAt)
- `AuditLog` (userId, action, entity, at)

**Seed loader** (`prisma/seed.ts`): imports `priya.json` and `arjun.json` exactly as provided (users, accounts, obligations, transactions, emergency events, bureau score, user flags). Add `npm run db:reset` = migrate + seed. Sample passwords not needed (login is persona picker).

**DataProvider interface** (`lib/data/providers/`): `SeedProvider`, `ManualProvider`, `CsvProvider` (generic bank-statement CSV mapper: date, narration, debit, credit, balance), and a stub `AAProvider` with the Setu/Finvu FIU flow documented but not implemented. All providers write into the same tables.

**Sample dataset facts (tests rely on these)**
- Priya: 300 transactions, 1 May to 3 Nov 2026. Salary ₹45,000 on the 5th. Average of Aug–Oct: income ₹45,000, dues ₹24,500, living ₹14,000 (food 6,000 incl. delivery 2,200; transport 4,000 incl. cabs 1,500; subscriptions 1,200; shopping 2,800). ATM cash ₹500/month and one-offs (May–Jul) are excluded from the baseline and surfaced separately. Savings account ₹24,350 of which ₹20,000 is earmarked. Emergency: dental surgery ₹60,000, due Fri 6 Nov 2026; salary arrives 5 Nov. Credit bureau score 704 (sample).
- Arjun: 208 transactions; monthly income 24,500 / 36,000 / 28,000 / 33,500 / 27,000 / 31,000 (average ₹30,000, 25th percentile ₹27,250); dues ₹12,000; living ₹11,000; savings account ₹6,200 (₹5,000 earmarked); emergency laptop repair ₹25,000 due 6 Nov.
- Every figure is fictional. Lenders ZenPay Later and FlexiPay are fictional; everyday merchants are real brand names used only as realistic labels.

---

## 6. Engine specification (`lib/engine/`, pure functions, versioned `ENGINE_VERSION`)

**6.1 Profile derivation (`profile.ts`)** (replaces typed constants)
- `income`: salaried = median of last 3 monthly salary credits; gig = average of last 6 months **and** 25th percentile (weak month). `incomeBasis` selects which one feeds headline numbers.
- `committedDues` = Σ current obligation payments (from `Obligation`), each verified by matching a debit in the last 60 days; unmatched obligations are flagged, not silently trusted.
- `livingExpenses` = trailing 3 full months, mean per month, of debits in living categories (food, transport, subscriptions, shopping, personal/misc, utilities, rent, education). Excludes debt repayments, savings transfers, `cash` (shown as "uncategorised cash"), and `one_off` (shown as "irregular spends avg").
- `safetyBuffer` = user setting (default ₹2,000) or, in Conservative mode, the average monthly one-off spend.
- `safeToBorrow` = income − committedDues − livingExpenses − safetyBuffer (floor 0). Priya must equal **₹4,500**.

**6.2 Obligation roll-off (`obligations.ts`)** amortise revolving balances monthly at apr/12 with the fixed payment; fixed-term items use `remainingMonths`. Output `duesByMonth[1..12]`. Priya: 24,500 / 24,500 / 20,000 / 8,364 / 0…

**6.3 Option pricing (`options.ts`)**, archetype catalog in `lib/lenders/archetypes.ts` (illustrative, versioned, clearly labelled):
- Card revolve (min payment `max(2000, 5%)` at 42% APR), BNPL 3-instalment (fee ~₹600 flat/or %), Card EMI 12m (13–18%, ₹999 + 18% GST processing; requires available limit), Instant personal loan 12m (APR bands by score: ≥750 prime 16–24%; 700–749 near-prime 24–30%; <700 above 30%; processing 1.5% + 18% GST).
- Each returns `{best, expected, pessimistic}` pricing, `eligibility`, `breakEvenApr` (max APR at which EMI ≤ Safe-to-Borrow, via bisection), and the full assumptions list.
- Existing checks must still pass at the deck's best case: card min ≈ ₹70,000 over ~35 months; BNPL ≈ ₹40,600 (₹13,333×3 + ₹600); card EMI ≈ ₹3,610/₹44,500; personal loan @16% ≈ ₹3,630/₹44,300.

**6.4 Stress and shock (`stress.ts`)**: roll-off-aware 12-month projection under scenarios (income −X%, job gap N months, surprise expense). Outputs `worstMonthlyGap`, `monthsInDeficit`, `peakCumulativeShortfall`, `cushion`, `passes`. The deck's "−₹2,500 before EMI at −20%" is the **month-1** figure (do not subtract the buffer in that line).

**6.5 Verdict (`decide.ts`)**: tiers from §2.4; choose the cheapest option that is `available` and not `RISKY`; fall back to `BORROW_LESS` / `USE_SAVINGS` / `DELAY` / `NEGOTIATE` with reasons. Return structured `reasons[]`, `alternativesRejected[]` (with why), `actions[]`, `prepaymentPlan` (month, amount, interest saved).

**6.6 Mitigation (`mitigation/`)** detectors from §4.5, each returning `{id, title, monthlySaving, effort, confidence, evidenceTxnIds, rationale}`.

**6.7 Forecast (`forecast.ts`)** projected month-end balances for 12 months (base and weak-income).

Every engine function returns a `trace` entry `{stage, inputs, formula, output, ms}` consumed by the Decision Trace panel.

---

## 7. API (Next.js Route Handlers; zod-validated; all scoped to the session user; no artificial latency)

`GET /api/overview`, `GET /api/transactions`, `PATCH /api/transactions/[id]` (recategorise + optional rule), `GET /api/obligations`, `GET /api/forecast`, `POST /api/events`, `POST /api/decision/run` (returns full result + trace), `POST /api/decision/[id]/save`, `GET /api/decisions`, `GET /api/savings/suggestions`, `POST /api/savings/actions/[id]/(accept|dismiss)`, `POST /api/import/csv`, `POST /api/consent/[id]/revoke`, `GET /api/export`, `DELETE /api/account`, `POST /api/chat`.

**Assistant (`/api/chat`)**
- **Tool-calling over the same engine**, never free-text numbers: tools `get_overview`, `get_obligations`, `get_options(eventId)`, `run_stress(drop)`, `get_savings_plan`, `explain_term(term)`.
- Provider-agnostic (`lib/ai/provider.ts`): Anthropic or Gemini if an env key is set; otherwise the deterministic intent router (extend the existing one, but **remove every hard-coded default**; if data is missing, say so).
- **Number guardrail:** after generation, extract every ₹ figure from the reply and verify it appears in that turn's tool outputs; if not, regenerate once, then fall back to a templated answer.
- Each reply shows a "Based on:" line listing the tool outputs used. Suggested prompt chips adapt to the screen. Tone setting: calm (default) / direct. No shaming. Never gives product-specific lender endorsements. Declines legal/tax/investment advice with a short pointer.

---

## 8. Trust, safety, compliance (build now, polish later)
- Consent records with purpose, scope, expiry, revoke; all data export and delete endpoints work.
- Disclaimer component on Decision and Assistant screens; "Illustrative rates" badge on every priced option.
- No PII in logs; money amounts only in server logs at debug level; `.env.example` lists optional keys.
- Rate-limit `/api/chat` and CSV import; validate uploads (size, type).
- Audit log entries for decision saved, consent revoked, data exported/deleted.

---

## 9. Project structure (target)

```
app/
  (auth)/login, onboarding
  (app)/layout.tsx            # sidebar + topbar shell
  (app)/page.tsx              # Overview
  (app)/cash-flow, obligations, savings, data, settings
  (app)/decision/page.tsx, new/page.tsx, [id]/page.tsx
  api/...                     # per §7
components/
  shell/ (Sidebar, TopBar, MobileTabs, AssistantDrawer)
  overview/ cashflow/ obligations/ savings/ decision/ (Stepper, TracePanel, OptionCard, VerdictCard...)
  ui/                         # shadcn + primitives
lib/
  engine/ (profile, obligations, options, stress, decide, forecast, mitigation/, trace.ts)
  lenders/archetypes.ts
  data/providers/ (seed, manual, csv, aa.stub)
  ai/ (provider, tools, guardrail, router)
  db.ts, session.ts, format.ts
prisma/ schema.prisma, seed.ts, seed-data/ (priya.json, arjun.json)
tests/ engine/*.test.ts, api/*.test.ts, e2e/smoke.spec.ts
```

---

## 10. Phases and acceptance criteria

**Phase 1: Foundation.** Prisma schema, seed loader, DataProviders, session/login, app shell with nav (empty pages OK), CI scripts. *Accept:* `npm run db:reset` loads both personas; login as Priya shows her name; build passes.

**Phase 2: Engine v2 + tests.** Profile derivation, obligation roll-off, archetype pricing with ranges, break-even APR, shock test, four-tier verdict, prepayment plan, mitigation detectors, forecast, trace. *Accept (Vitest, tolerance ±₹10 unless noted):* Priya safe-to-borrow = 4,500; income 45,000; dues 24,500; living 14,000; credit gap 40,000; duesByMonth = [24500, 24500, 20000, 8364, 0…]; 16% loan EMI ≈ 3,630 and break-even APR ≈ 59%; card-min ≈ ₹70,000/35 months; BNPL option flagged **unavailable** (limit left ₹6,000); card EMI **available**; month-1 shock at −20% before EMI = −2,500; Priya verdict with accepted plan = `SAFE_WITH_PLAN`, without plan ≠ `SAFE`; mitigation total ≈ 3,283 (±50) with the four named actions; Arjun typical vs weak-month capacity ≈ 5,500 vs ≈ 2,750.

**Phase 3: Overview, Cash Flow, Obligations.** Real data from the DB, charts, inline recategorise with rules, roll-off chart, forecast. *Accept:* no hard-coded numbers in components; recategorising a merchant updates category totals after refresh.

**Phase 4: Decision Lab.** Stepper + Trace panel + all 7 steps + save/reopen + export view. *Accept:* run Priya end to end in under 90 seconds; trace durations come from real timings; reopening a saved decision shows identical numbers; switching to Arjun produces a different, coherent verdict.

**Phase 5: Savings Finder + Data/Consent + CSV import.** Evidence-backed suggestions, accept/dismiss, plan tracking, simulated AA consent, revoke, export, delete. *Accept:* accepting actions changes verdict tier live; revoking consent marks the source inactive; CSV with date/narration/debit/credit/balance imports and categorises.

**Phase 6: Assistant.** Tool-calling, guardrail, fallback router, no hard-coded defaults. *Accept:* with no env keys the assistant answers the six canned questions from live data for **both** personas; a unit test proves the number guardrail rejects an invented figure; if data is missing it says so.

**Phase 7: Polish + QA.** Responsive at 390px, Calm Mode, dark mode, empty/loading/error states, a11y pass, Playwright smoke test (login → overview → run decision → save → savings → assistant), README (setup, architecture, data modes, how to add an AA provider, known limitations).

### Global acceptance checklist
- [ ] No number on any screen is hard-coded; all derive from DB data and the engine.
- [ ] Zero dependence on API keys; zero artificial delays.
- [ ] Works for Priya, Arjun, and a brand-new manual user (empty states handled).
- [ ] Every priced option says *Illustrative*; decision screens carry the disclaimer.
- [ ] `npm test` and `npm run build` pass; Playwright smoke passes.
- [ ] Lighthouse accessibility ≥ 90 on Overview and Decision pages.

## 11. Non-goals for this MVP
Real AA/FIU integration, real lender APIs or applications, payments, push notifications, multi-user households, investments, credit-score fetching, native mobile apps. (Design the code so each can be added behind an interface.)
