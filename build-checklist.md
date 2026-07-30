# Build Checklist — Session by Session

How to use this: each numbered item is roughly **one Claude Code session**. Copy the "Prompt to use" text (or adapt it) as your message to Claude Code. After it finishes, do the "Test before moving on" step yourself before starting the next item. Check items off as you go.

Do not skip the testing step, even if it feels slow — this is what keeps you in control of a codebase you didn't write yourself.

---

## Phase 0 — Repository Setup

- [ ] **0.1 Create the repository**
  Do this yourself first: create a new **private** repository on GitHub (no need for Claude Code here — just click "New" on github.com).

- [ ] **0.2 Open a Codespace and configure the project**
  Prompt: *"Set up this repo for an Expo React Native + Supabase project. Create a proper .gitignore for this stack, an .env.example with placeholder Supabase keys, and a devcontainer.json so every Codespace has Node and Expo CLI ready to go. Add an MIT license. Explain where I should put my real Supabase keys so they never get committed."*
  Test: Confirm `.env` is NOT visible in git (`git status` shouldn't show it once you add real keys), and that `.env.example` IS tracked with placeholder values only.

- [ ] **0.3 Store real secrets safely**
  Do this yourself: go to your repo's Settings → Secrets and variables → Codespaces, and add your real Supabase URL and anon key there. This makes them available inside every Codespace automatically, on any PC, without ever being in your code.
  Test: Rebuild/restart your Codespace and confirm the app can still connect to Supabase.

- [ ] **0.4 Starter README**
  Prompt: *"Create a starter README with the project name, a one-line description, and a 'Status: In Progress' note. We'll flesh this out properly in Phase 5."*

---

## Phase 1 — Foundation

- [ ] **1.1 Project setup**
  Prompt: *"Set up a new Expo React Native project for this app. Connect it to a new Supabase project (walk me through creating the Supabase account and getting the API keys first). Read CLAUDE.md for context before starting."*
  Test: App runs in Expo Go on your phone and shows a blank/placeholder screen with no errors.

- [ ] **1.2 Database schema**
  Prompt: *"Set up the Supabase database tables based on the Data Model section in CLAUDE.md."*
  Test: Open the Supabase dashboard, confirm the tables exist with the right columns.

- [ ] **1.3 Login/signup screens**
  Prompt: *"Build login and signup screens using Supabase Auth. Keep the design simple for now — we'll polish visuals later."*
  Test: Create a test account, log out, log back in. Try a wrong password and confirm you see an error, not a crash.

---

## Phase 2 — Core Comparison

- [ ] **2.1 Seed demo loan data**
  Prompt: *"Help me add 12-15 realistic demo loan products to the loans table — mix of personal and business loans from different fictional or realistic-sounding Singapore banks, with varied rates and tenures."*
  Test: Confirm the data looks realistic and varied when you view the table in Supabase.

- [ ] **2.2 Comparison list screen**
  Prompt: *"Build a loan comparison screen that lists all loans from the database, with filter (by loan type) and sort (by interest rate) controls."*
  Test: Filters and sorting actually change what's shown, on a real device.

- [ ] **2.3 Loan detail screen**
  Prompt: *"Build a loan detail screen showing full info for a single loan, reachable by tapping a loan in the comparison list."*
  Test: Tap through from list to detail and back, for a few different loans.

- [ ] **2.4 Calculators**
  Prompt: *"Add an EIR calculator and a monthly repayment calculator with an amortization schedule view to the loan detail screen. Comment the calculation logic clearly since I'll need to explain it."*
  Test: Plug in numbers you can sanity-check by hand (or ask Claude Code to show its math) and confirm the output looks right.

---

## Phase 3 — Application Flow

- [ ] **3.1 Eligibility questionnaire**
  Prompt: *"Build a simple eligibility questionnaire screen (age, income range, employment type) that a user fills out before applying."*
  Test: Submit the form with a few different answers, confirm it saves/proceeds correctly.

- [ ] **3.2 Document upload (demo-safe)**
  Prompt: *"Build a document upload screen per the constraints in CLAUDE.md — file picker UI, but no real storage/processing of file contents. Show a polished 'Received' confirmation after 'upload'."*
  Test: Confirm you can pick a file and see the confirmation, and confirm (ask Claude Code to explain) that it isn't actually persisting file contents.

- [ ] **3.3 Status tracker**
  Prompt: *"Build an application status tracker screen showing pre-seeded demo statuses (Submitted, Under Review, Approved) tied to the applications table."*
  Test: Confirm the screen displays correctly for a test application record.

---

## Phase 4 — Polish

- [ ] **4.1 Visual design pass**
  Prompt: *"Apply a consistent visual design across all screens — colors, typography, spacing, icons. [Describe any style preference you have, e.g. 'clean and modern, similar to a fintech app like Revolut.']"*
  Test: Click through the whole app, confirm it feels visually consistent, not like separate mismatched screens.

- [ ] **4.2 Onboarding/welcome flow**
  Prompt: *"Add a short onboarding flow shown on first launch, introducing the app before the login screen."*
  Test: Reinstall/reset the app and confirm onboarding shows on first launch, not on every launch.

- [ ] **4.3 Edge cases & error handling**
  Prompt: *"Go through the app and add proper loading states, empty states (e.g. no search results), and error handling (e.g. no internet connection)."*
  Test: Turn off your phone's wifi/data and try using the app — it should fail gracefully, not crash.

- [ ] **4.4 Demo labeling**
  Prompt: *"Add a small 'Demo App — Portfolio Project' label somewhere visible, like a footer or About screen, per CLAUDE.md."*
  Test: Confirm it's visible but not obtrusive.

---

## Phase 5 — Ship

- [ ] **5.0 Finalize README & go public**
  Prompt: *"Help me write a complete README — what the app does, why I built it, the tech stack, screenshots, and a short case study section on the product decisions I made."*
  Then do this yourself: go to repo Settings → Danger Zone → Change visibility → **Public**.
  Test: View the repo in an incognito/private browser window to confirm it looks right to an outside visitor.

- [ ] **5.1 App icon & screenshots**
  Prompt: *"Help me generate/set an app icon and take clean screenshots for the App Store listing."*

- [ ] **5.2 EAS Build**
  Prompt: *"Walk me through setting up EAS Build to create an iOS build of this app, including creating my Apple Developer account if I haven't already."*
  Test: Build completes without errors.

- [ ] **5.3 TestFlight setup**
  Prompt: *"Walk me through uploading this build to TestFlight and inviting testers by email."*
  Test: Install the app on your own phone via the TestFlight link, as if you were a hiring manager.

- [ ] **5.4 Final pass**
  Test only (no prompt needed): Ask 2-3 people to install via TestFlight without any guidance from you, and watch where they get confused. Fix the worst friction points.

---

## After Each Session — Habit to Build

Once something works, ask Claude Code to help you save it with git (see the getting-started guide for what this means). Roughly: *"Commit this work with a clear message describing what we just built."* This gives you a checkpoint to roll back to if a later session breaks something.
