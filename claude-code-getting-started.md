# Getting Started — Terminal, Git & Claude Code for Total Beginners

This is your one-time reference for the basics you'll need before starting the build checklist. Read this once, keep it nearby for the first week or two.

---

## 1. What Is "the Terminal"?

The terminal is a text-based way to talk to your computer — instead of clicking icons, you type commands. It looks intimidating but you'll only need a handful of commands for this project.

**On a Mac** (you'll need a Mac for iOS development): open **Spotlight Search** (press `Cmd + Space`), type "Terminal", press Enter. A plain window with text opens — that's it, that's the terminal.

A few commands you'll actually use:

| Command | What it does |
|---|---|
| `cd foldername` | "Change directory" — moves you into a folder |
| `cd ..` | Moves you back out one folder |
| `ls` | Lists what's in the current folder |
| `pwd` | Shows you which folder you're currently in ("print working directory") |

You don't need to memorize these — Claude Code will often tell you exactly what to type, or type it for you.

---

## 2. What Is Git, and Why Do You Need It?

Git is a tool that saves **snapshots** of your code as you build, so you can go back in time if something breaks. Think of it like a very powerful "undo history" for your whole project, plus a way to back it up online (via GitHub).

Three commands cover almost everything you'll do manually:

| Command | What it does |
|---|---|
| `git status` | Shows what's changed since your last snapshot |
| `git add .` | Stages all your changes to be saved |
| `git commit -m "description"` | Saves a snapshot with a note describing what changed |

There's a fourth command that matters a lot for your multi-PC setup:

| Command | What it does |
|---|---|
| `git push` | Uploads your committed snapshots to GitHub, so they're accessible from any other PC |

In practice, you'll mostly just ask Claude Code to do this for you (e.g. *"commit this and push it to GitHub"*), and it will run these commands itself. You don't need to type them by hand, but it helps to understand what's happening when you see it happen. **The push step is the one that actually matters for working across multiple computers** — commit alone only saves locally (or within your current Codespace); push is what syncs it to GitHub for next time.

**GitHub** is a separate thing — a website where your code is backed up online, and where hiring managers can view it. Since you're working across multiple PCs with a cloud setup, GitHub isn't just a backup here — it's your project's actual home base. You'll want a free GitHub account before Phase 1. Claude Code can walk you through creating a repository there and connecting your project to it the first time you ask it to commit.

---

## 3. Two Ways to Work: Local vs. Cloud

**If you're always on the same PC**, the traditional path is to install everything locally (Node.js, project files, etc.) — Claude Code will prompt you to install each thing at the point it's needed.

**If you want to work across multiple different PCs with nothing stored locally** (your case), use a cloud development environment instead. This changes almost nothing about how you interact with Claude Code or the checklist — it just changes *where* the code and tools physically live.

### The Cloud Setup: GitHub Codespaces

Think of a Codespace as a full computer that lives inside GitHub's servers, which you control through a browser tab. Your code lives there, not on your PC. Close the tab, walk away, sit down at a different computer, open the same link — everything is exactly as you left it.

What you need on **any** PC you use:
- A web browser
- Nothing else. No installs, no local files.

Setup (one-time):
1. **A free GitHub account** — this is now your home base, not optional
2. **Create a repository** for this project on GitHub (Claude Code can walk you through this the first time you ask it to commit, or you can create an empty one upfront)
3. **Launch a Codespace** from that repository — on the repo's GitHub page, there's a green "Code" button → "Codespaces" tab → "Create codespace." This opens a full coding environment in your browser (looks similar to a code editor), with a built-in terminal.
4. **Install Claude Code inside the Codespace** — same install process as local, just run it in the Codespace's terminal instead of your own. It behaves identically.
5. **A free Supabase account** (Claude Code will guide you through this in session 1.1 — works the same regardless of where you're coding from)
6. **The Expo Go app** on your iPhone (from the regular App Store) — this lets you preview your app live on your phone while building

One extra step for testing on your phone: since your dev environment is now in the cloud instead of on your desk, when you start the Expo preview server you'll need to add `--tunnel` to the command (e.g. ask Claude Code to *"start the Expo dev server with tunnel mode"*) so your phone can reach it over the internet instead of your home wifi. Claude Code will handle this for you if you mention you're working from a Codespace.

**Cost note:** GitHub Codespaces has a free monthly usage allowance (currently 60 hours/month on free personal accounts, correct as of my knowledge — worth double-checking current limits on GitHub's pricing page since these change) and paid tiers beyond that. For a project of this size worked on casually over several weeks, you'll likely stay within or close to the free tier, but it's worth keeping an eye on.

**You don't need a Mac either way.** Building the actual iOS app happens on Expo's cloud servers (EAS Build) regardless of whether you're coding locally or in a Codespace — so a Mac was never actually a requirement for this project.

---

## 4. What a Typical Session Looks Like (Cloud Setup)

Once you're set up, here's the rhythm you'll repeat for each checklist item, from any PC:

1. **Open your browser**, go to your repository on GitHub, launch (or resume) your Codespace
2. **Open the built-in terminal** inside the Codespace (it's right there in the browser interface, no separate app needed)
3. **Start Claude Code** by typing `claude` and pressing Enter
4. **Give it the prompt** from the current checklist item (paste it in, or describe the goal in your own words — Claude Code has already read `CLAUDE.md` for context)
5. **Let it work** — it'll write code, and may ask you questions or ask permission before doing certain things (like installing a new tool)
6. **Test it yourself** — open Expo Go on your phone, scan the QR code from the tunnel-mode dev server, check the feature it just built actually works, following the "Test before moving on" line in the checklist
7. **If something's wrong**, just describe what you saw ("the button doesn't do anything" or "it crashed when I typed a number") — you don't need to know *why* it broke, just what happened
8. **If it works**, ask Claude Code to commit and push the work to GitHub before ending the session — this is the step that makes it available from your next PC
9. **Close the browser tab** — nothing is lost, your Codespace and code are saved on GitHub's servers, ready to resume from wherever you open it next

---

## 5. A Few Reassurances

- You will see error messages. This is completely normal, even for experienced developers — just copy/paste the error to Claude Code and it will usually explain what happened and fix it.
- You don't need to understand every line of code Claude Code writes. You do want to understand *what each screen/feature does* and *roughly how the calculators work*, since you may need to explain the project in interviews — ask Claude Code to explain anything in plain language whenever you want.
- Going slowly (one checklist item at a time, testing each one) will feel slower than asking for everything at once — but it's what keeps you able to catch problems while they're small and easy to fix.
