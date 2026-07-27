# Class Progress Tracker

A self-paced classroom progress tracker with a vertical "thermometer" view: a
single shared lesson list, multiple class "blocks" (periods) each with their
own roster, and each student's position in the list reflects which lesson
they're currently on. Every lesson breaks down into a few sub-steps (e.g.
Lesson / Practice / Mastery, customizable per lesson). Only names and coarse
position are public — tapping a name and entering a 4-digit PIN is required to
see or check off that student's own lesson detail (with a little confetti
celebration on each step). The teacher has a passcode-gated admin view for
managing lessons/steps, rosters, and overriding any student's progress
directly (no PIN needed there).

## Running it each day (classroom laptop)

Double-click **`start.command`**. It installs dependencies on first run, builds
the app, and starts the server. It will print two addresses:

- `http://localhost:3000` — open this on the teacher's own laptop.
- A `Network` address (e.g. `http://192.168.1.106:3000`) — open this on
  student Chromebooks/tablets connected to the **same wifi network**.

Leave the terminal window open while class is in session; closing it stops the
server. Press `Ctrl+C` in that window (or just close it) when you're done.

> First time double-clicking `start.command`, macOS may warn that it's from an
> unidentified developer. Right-click the file, choose **Open**, and confirm —
> you only need to do this once.

## First-time setup

1. Requires [Node.js](https://nodejs.org) 20+ installed on the laptop.
2. Open `.env` and set `TEACHER_PASSCODE` to something the teacher will
   remember (this is what unlocks the `/teacher` admin view — it's not a real
   login system, just a shared gate). A random `SESSION_SECRET` is already
   filled in; leave it as-is.
3. Run `start.command` once to install dependencies and start the server.
4. Go to the `Network` address from a browser, click **Teacher**, sign in with
   the passcode, and add a block (e.g. "Period 1") and some lessons.
5. Add students one at a time from **Roster**, or bulk-load them from
   **Import Roster** with a CSV (`name`, `block`, `pin` columns — `pin` can be
   left blank to auto-generate one).

## For developers

```bash
npm install
npm run dev        # local only, http://localhost:3000
npm run dev:lan     # binds 0.0.0.0, reachable from other devices on the LAN
npm run build && npm run start:lan   # production mode
npm run seed        # reset/reseed demo data (Period 1, 6 students, 8 lessons)
```

Data is stored in a local SQLite file (`dev.db`) via Prisma — see
`prisma/schema.prisma` for the data model. There's no real authentication:
students unlock their own row with a 4-digit PIN (server-validated, short-lived
token), and the teacher view is gated by a single shared passcode
(`TEACHER_PASSCODE` in `.env`). This is intentionally lightweight, not
security-grade — see the project plan for the reasoning.

A hosted/URL deployment (swapping SQLite for a hosted Postgres/Turso database)
is a natural next step but isn't set up yet; the Prisma-based data layer was
chosen specifically so that move doesn't require a rewrite.
