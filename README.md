# Centsible — Financial Emergency Decision Assistant
> **IDEATHON 2026 (Fintech Track)** · *Borrow with clarity, not panic.*

Centsible is an interactive financial decision engine designed to protect Indian consumers facing sudden emergencies (medical bills, critical repairs, tuition deadlines). Rather than asking *"Which lender will approve me?"*, Centsible answers:

1. **Can I afford this loan?**
2. **What will it truly cost?**
3. **What happens if my income drops?**
4. **Where can I free up cash to safeguard my finances?**
5. **What is the optimal, non-predatory decision?**

---

## 🚀 Quick Start (Runs 100% Offline with Zero API Keys)

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic unit tests
npm test

# 3. Launch presentation demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 7-Step Pitch Demo Talk Track (Presentation Script)

| Step | Engine Stage | Screen Focus | Speaker Talk Track |
|---|---|---|---|
| **1** | **Link Data** | Verified Cash Flow Ingestion | *"Meet Priya, 26, graphic designer. A ₹60,000 dental surgery bill is due this Friday. Lending apps are already bombarding her with 'instant 1-click approvals'. Centsible ingests her verified Account Aggregator data to see what she can actually afford."* |
| **2** | **Apply Savings** | Capital Allocation Bar | *"Before borrowing a single rupee, Centsible checks her liquid cushion. She has ₹20,000 in savings. By putting savings to work first, her borrowing need drops from ₹60,000 to ₹40,000, immediately cutting 33% of compounding interest."* |
| **3** | **Safe-to-Borrow** | Waterfall & Affordability Gauge | *"Credit approval ≠ Affordability. A lender app approves her for ₹1,50,000 based on gross salary. But our deterministic engine runs the real math: Income ₹45k − Dues ₹24.5k − Living essentials ₹14k − Cushion buffer ₹2k = **₹4,500/month maximum safe EMI**."* |
| **4** | **Compare True Costs** | 4 Avenues Side-by-Side | *"Priya compares 4 options for ₹40,000. Paying the Credit Card Minimum pays ₹2,000/mo but traps her for 35 months and costs ₹70,000. 3-Month BNPL demands ₹13,333/mo—almost 3× her safe capacity. The 12-month Personal Loan at 16% costs ₹3,630/mo (₹44,259 total) and is comfortably safe."* |
| **5** | **Stress Test** | Income Shock Simulator | *"What if Priya's freelance clients delay payment or her salary drops by 20%? The simulator flags a ₹2,500/mo deficit BEFORE she borrows. Adding the new EMI widens the hole to −₹6,130/mo. We flag this **before** she signs the contract."* |
| **6** | **Mitigation Layer** | Cost-Freeing Micro-Adjustments | *(New Feature)* *"Instead of guilt, Centsible pinpoints 4 gentle spending adjustments: batch cooking 3 weekdays (save ₹1,200), switching commute to Metro (save ₹700), pausing 2 inactive subscriptions (save ₹700), and an impulse shopping lock (save ₹800). **Total freed: ₹3,400/month.** This eliminates the deficit and turns her cash flow positive (+₹900/mo). Prepaying 50% clears the loan 4 months early!"* |
| **7** | **Decision** | Recommendation & Execution | *"Optimal verdict: Borrow ₹40,000 via 12m Personal Loan. Hero metric: **Smarter choice saves Priya ≈ ₹26,000** compared to revolving credit card debt. Clear 3-step action roadmap. Commission-free and 100% aligned with the borrower."* |

---

## ⌨️ Interactive Controls & Shortcuts

- **▶ Play Demo Button**: Autoplays the complete 7-step pipeline (~4s per step) for live stage presentations.
- **`←` / `→` Arrow Keys**: Step backward / forward through the pipeline.
- **`Space`**: Toggle Play / Pause demo autoplay.
- **`C`**: Toggle the AI Accountant drawer.
- **`Esc`**: Close drawers / modals.
- **Persona Switcher**: Switch instantly between **Priya** (salaried default), **Arjun** (gig worker with variable income), and **Meera** (higher income, education expense).

---

## 🤖 AI Accountant (`/api/chat`)

The AI Accountant provides instant answers grounded directly in the computed engine results (zero hallucination):
- *"Can I afford this?"*
- *"Which option is cheapest?"*
- *"What if my income drops?"*
- *"How can I save more?"*
- *"Why is BNPL risky?"*
- *"Explain Safe-to-Borrow"*

### Optional Hosted LLM Mode
By default, the demo runs **100% offline** via deterministic intent routing. If you want to use a live LLM, add your API key to `.env.local`:

```bash
# Optional:
GEMINI_API_KEY="your-gemini-api-key"
```

The system prompt injects ground truth computed numbers and strictly forbids invented figures.

---

## 📐 Project Structure

```
centsible/
├── app/
│   ├── api/
│   │   ├── persona/route.ts       # Persona profile & AA sources
│   │   ├── safe-to-borrow/route.ts# EMI capacity waterfall
│   │   ├── options/route.ts       # 4 borrow options & amortizations
│   │   ├── stress/route.ts        # 12-month surplus/deficit projections
│   │   ├── mitigation/route.ts    # Cost-cutting impact calculations
│   │   ├── decision/route.ts      # Final recommendation matrix
│   │   └── chat/route.ts          # Grounded AI Accountant endpoint
│   ├── layout.tsx                 # Root layout with fonts & meta
│   ├── page.tsx                   # App Shell (Processing Flow + Main Stage)
│   └── globals.css                # Visual design tokens & scrollbars
├── components/
│   ├── pipeline/
│   │   ├── PipelinePanel.tsx      # Vertical 7-node signature flow panel
│   │   ├── PipelineNode.tsx       # State node with Accordion Input/Output
│   │   └── DataPacket.tsx         # Framer Motion animated connector packets
│   ├── steps/
│   │   ├── LinkData.tsx           # Step 1: AA ingestion & question flow
│   │   ├── ApplySavings.tsx       # Step 2: Bill split & savings slider
│   │   ├── SafeToBorrow.tsx       # Step 3: Waterfall & approval vs affordability
│   │   ├── CompareOptions.tsx     # Step 4: 4 loan cards & cost comparison
│   │   ├── StressTest.tsx         # Step 5: Income shock slider & 12m chart
│   │   ├── Mitigation.tsx         # Step 6: Cost-freeing levers & live before/after
│   │   └── Decision.tsx           # Step 7: Hero recommendation & ₹26,000 saved
│   └── chat/
│       └── ChatDrawer.tsx         # Grounded AI Accountant slide-over
├── lib/
│   ├── engine/
│   │   ├── emi.ts                 # Standard EMI & credit card amortization
│   │   ├── safeToBorrow.ts        # Affordability engine
│   │   ├── options.ts             # 4 options calculation engine
│   │   ├── stress.ts              # Stress test engine
│   │   ├── mitigation.ts          # Mitigation layer engine
│   │   └── decide.ts              # Recommendation & alternative verdicts
│   ├── format.ts                  # Indian Rupee formatting (en-IN, ₹)
│   ├── sample-data.ts             # Priya, Arjun, Meera personas & AA data
│   └── utils.ts                   # Tailwind merge utility
├── tests/
│   └── engine.test.ts             # Vitest unit test suite (100% pass)
└── tailwind.config.ts             # Palette: deep navy, safe green, risk red
```

---

## 🛡️ Mathematical Verification (Unit Tests)

All calculations are tested via Vitest against the pitch deck specifications:
- **Safe-to-Borrow**: `45,000 − 24,500 − 14,000 − 2,000 = ₹4,500`
- **Credit Gap**: `60,000 − 20,000 = ₹40,000`
- **Card Minimum Due**: `42% APR, ₹2,000/mo → ~35 months, total ≈ ₹70,000` (RISKY)
- **BNPL 3 Months**: `₹13,333/mo × 3 + ₹600 = ≈ ₹40,600` (RISKY, 3× safe limit)
- **Card EMI 12 Months**: `15% p.a. + ₹999 fee (+18% GST) → EMI ≈ ₹3,610, total ≈ ₹44,500` (SAFE)
- **Personal Loan 12 Months**: `16% p.a. + 1.5% fee (+18% GST) → EMI ≈ ₹3,630, total ≈ ₹44,259` (SAFE · RECOMMENDED)
- **Stress Test at −20%**: `36,000 − 24,500 − 14,000 = −₹2,500` before EMI
- **Mitigation Layer**: `₹1,200 (Food) + ₹700 (Transit) + ₹700 (Subs) + ₹800 (Shopping) = ₹3,400/month` freed cash (flips stress from −₹2,500 to +₹900)
- **Direct Savings vs Worst Option**: `₹70,000 − ₹44,259 ≈ ₹25,741–₹26,000`

---
*Created for IDEATHON 2026 · Centsible: Borrow with clarity, not panic.*

