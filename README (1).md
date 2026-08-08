# SEC Recruitment Portal

Committee recruitment portal for the Sunway Entrepreneurs Club. Public position board,
five-question application step, and an admin dashboard for reviewers.

Runs on Vercel. No build step, no dependencies to install.

---

## Deploy — about 15 minutes

### 1. Push to GitHub

Create the repository under a **club-owned GitHub account or organisation**, not a personal one.
A repo on a personal account leaves when that person graduates.

```bash
git init
git add .
git commit -m "SEC recruitment portal"
git remote add origin https://github.com/<club-account>/sec-recruitment-portal.git
git push -u origin main
```

### 2. Import into Vercel

vercel.com → **Add New → Project** → import the repo → **Deploy**.
Framework preset: **Other**. No build command, no output directory.

The first deploy will show an error on the page. That's expected — the database isn't attached yet.

### 3. Create the database

Vercel dashboard → your project → **Storage** → **Create Database** → **Upstash for Redis** →
create → **Connect to Project**.

Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. Nothing to copy or paste.
The free tier is far more than this needs.

### 4. Add environment variables

Project → **Settings** → **Environment Variables**. Add these for **all** environments:

| Name | Value |
|---|---|
| `SESSION_SECRET` | A long random string. Generate with `openssl rand -base64 32` |
| `ADMIN_USERS` | `admin:SECADMIN` (single shared login) or `amadeus:pw1,angelene:pw2` (one per reviewer) |

`ADMIN_USERS` is a comma-separated list of `username:password`.

**Single shared login:** set `ADMIN_USERS=admin:SECADMIN`. The username box is prefilled with
`admin`, so reviewers only type the password. Simplest to run.

**One login per reviewer** (`amadeus:pw1,angelene:pw2`) is better if you can manage it. Decisions
and reviewer notes are recorded against the username — with a shared login every note reads
"admin", and when someone leaves the committee you have to change the password for everyone.

Either way: **this password is the only thing protecting applicants' names, Sunway iMail addresses
and written answers.** If it ends up in a group chat, on a slide, or on a poster, that data is
public. Change it at the end of each recruitment cycle.

Optional:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini key. Can also be set later from the admin Settings tab. |
| `GEMINI_MODEL` | Defaults to `gemini-2.0-flash`. Change if you want a different model. |

### 5. Redeploy

Deployments → the latest one → **Redeploy**. Environment variables only take effect on a new deploy.

### 6. First sign-in

Open the site → **Committee sign in** at the bottom → your `ADMIN_USERS` credentials.

On first load the database is seeded with SEC's current structure and the five open positions.
From the admin panel you can then:

- **Positions & questions** — rename, re-level, move between departments, change seat counts,
  reorder, add, delete. Generate and publish question sets.
- **Settings** — set the QR destination, the application deadline, and the Gemini API key.
- **Applicants** — read answers, set decisions, leave attributed notes, export CSV.

### 7. Before you share the link

- [ ] Set the **application deadline** in Settings. The board says "to be announced" until you do.
- [ ] Set the **QR destination** in Settings.
- [ ] Check every open position shows a real seat count and published questions.
- [ ] Submit one test application yourself, end to end, then delete it.
- [ ] Confirm a filled position shows **Filled** and has no Apply button.

---

## How it works

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/state` | GET | public | Position board. Draft questions and admin fields are stripped. |
| `/api/state` | PUT | admin | Save positions and settings |
| `/api/session` | POST / DELETE / GET | — | Sign in, sign out, who am I |
| `/api/applications` | POST | public | Submit an application (validated server-side) |
| `/api/applications` | GET / PATCH / DELETE | admin | Review, decide, remove |
| `/api/generate` | POST | admin | Ask Gemini for four draft questions |
| `/api/export` | GET | admin | CSV of applications and answers |

Storage keys: `sec:state`, `sec:applications`, `sec:gemini_key`.

### Design decisions worth knowing

**The Gemini key never reaches the browser.** It lives in an environment variable or in server-side
storage. The API returns only a `keySet` boolean. A key in front-end code is readable by every
visitor.

**Questions are frozen when published.** Generate produces a *draft* that nobody can see. A human
edits it and publishes. A position with no published questions shows **Opening soon** with no Apply
button — never a button that leads nowhere. Editing questions that already have applications raises
a warning, because applicants can't be compared fairly if they answered different things.

**The fifth question is always the commitment question** and is not generated. Availability is the
best single predictor of whether someone lasts a term, so it isn't left to a model.

**Answers are immutable.** Nothing in the admin UI or the API can edit a submitted answer or its
timestamp. Decisions and notes are attributed to the reviewer's username. That's what makes the
dashboard evidence rather than an assertion.

**Questions are snapshotted onto each application.** If you later change a position's questions,
old applications still show what that person was actually asked.

**Server-side validation.** iMail domain, five answers, the 150-word cap, duplicate applications,
and applying to a closed position are all enforced in the API, not just the browser.

---

## Operating notes

**Data retention.** Applicant data must be deleted or archived within **60 days** of the cycle
closing, with a named owner. Export the CSV, then remove the applications. Don't let a database of
student emails accumulate across committees.

**No undo.** Deleting an application is permanent. Export first.

**Matching is manual.** A QR can't carry the applicant's name and iMail to the Google Form, so
portal answers and Form responses have to be matched by hand on whatever email each person typed
twice. Mark each one with **Mark form received** in the dashboard. Putting the position as a
required dropdown on the Form makes reconciliation much easier.

**Concurrency.** State is stored as a single document with last-write-wins. Fine for a committee of
this size; two people editing positions at the same moment can overwrite each other. Don't edit
positions simultaneously.

**If the portal goes down two days before the deadline**, recruitment must still be able to run on
the Google Form alone. That fallback is the reason the QR exists independently of this app.

---

## Handover

The portal is worthless to SEC if it stops working when its builder graduates.

- [ ] GitHub repo, Vercel project, and database on **club-owned accounts**
- [ ] **Two admins** on the Vercel project and the database
- [ ] Gemini API key on the **club** Google account
- [ ] `SESSION_SECRET` and `ADMIN_USERS` recorded in the club's password manager — **not** in Drive,
      not in WhatsApp, not in a document
- [ ] `ADMIN_USERS` updated at every committee change: add the new reviewers, remove the old ones
- [ ] This README kept current
- [ ] Entry in the club handover documentation before the builder's term ends

---

## Outstanding club decisions

Not code problems, but they should be closed before launch:

1. **Department naming.** The portal says *Recruitment* and *Partnership & Growth*; the Student LIFE
   committee list for term 04/26–04/27 says *Human Resources* and *Public Relations*. Pick one and
   make both documents agree.
2. **Events registration.** Two Events Executives appear on the registered list but aren't seated.
   The registration needs updating, and any partial term of service needs recording.
3. **Vice Secretary and Vice Treasurer** have no approved job description and aren't on the
   registered committee list. Drafts are seeded into the portal and need officer sign-off. Note that
   the role has previously existed as *Assistant Secretary* in the 2024 and 2025/26 lists.
4. **Retention owner** for the 60-day deletion.
5. **Unrelated but more urgent:** `Sunway Entrepreneurs Club Assets.docx` in the club Drive contains
   plaintext passwords for the club Gmail, Instagram, Facebook and Linktree. Rotate them, move them
   to a password manager, and delete the file.
