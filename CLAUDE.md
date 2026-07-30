# Project Brief: Loan Funding Option App

## What This Is
A portfolio/demo iOS app built to show hiring managers I can take a product from idea to a shipped, working app. It is a **bank loan comparison app for Singapore-based borrowers**. It is NOT a real financial service — no real user data, no real bank integrations, no real sales operations.

## Audience & Goal
Hiring managers will download this via TestFlight and use it as a real user would: browse, compare loans, log in, "apply" for a loan, see a status update. The bar is: it should feel complete, polished, and functional — not necessarily feature-complete against a real product spec.

## Hard Constraints (do not deviate without asking)
- **Do not implement real storage or processing of sensitive documents.** The document upload screen should accept a file selection and show a realistic "Received" confirmation, but must not require, validate contents of, or persist actual financial documents (CBS reports, income statements, bank statements) in a way that would matter if a real person uploaded real data.
- **No real backend for emailing sales reps, no real sales rep accounts.** The application status tracker should use pre-seeded/mock status data, not a live handoff system.
- This is a **demo app** — label it as such somewhere in the UI (e.g. footer or about screen).
- Distribution is via **TestFlight**, not full public App Store listing, unless told otherwise.

## Tech Stack
- **Mobile app**: React Native with Expo (use EAS for builds)
- **Backend/DB/Auth/Storage**: Supabase
- Keep the stack minimal — do not add extra libraries or services beyond what's needed for the current task.

## Scope — In
- Real login/signup (Supabase Auth) — email + password or OTP, doesn't need to be elaborate
- Loan comparison list/table: filter and sort by loan type, interest rate, tenure
- Loan detail screen
- EIR (Effective Interest Rate) calculator
- Monthly repayment calculator with amortization schedule view
- Document "upload" screen (demo-safe, see constraints above)
- Eligibility questionnaire (simple form, no real verification)
- Application status tracker screen with pre-seeded demo states (e.g. Submitted → Under Review → Approved)
- Clean onboarding/welcome flow
- Polished empty states, loading states, and error handling

## Scope — Out (do not build unless explicitly asked)
- Real email/notification integration to sales reps
- Real bank rate data pipeline or API integrations
- Admin/sales rep dashboard
- Editorial content/blog system
- Rate alert subscriptions
- Android build
- Any real compliance/security infrastructure (PDPA tooling, encryption beyond Supabase defaults, audit logging)

## Data Model (starting point — refine as needed)
- **users**: id, email, name, created_at
- **loans**: id, bank_name, loan_type (personal/business), interest_rate, tenure_months, processing_fee, eligibility_notes
- **applications**: id, user_id, loan_id, status, submitted_at, updated_at
- **documents**: id, application_id, file_name, uploaded_at (metadata only — see constraints, don't store/process real file contents meaningfully)

## Working Style
- Build one screen or feature at a time. Stop after each and describe what to test before moving to the next.
- Prefer simple, readable code over clever abstractions — this is a solo-maintained demo project, not a large team codebase.
- When unsure about a product decision (not a technical one), ask rather than assume.
- Comment non-obvious logic, especially the calculators (EIR, amortization) since I may need to explain this code in interviews.
