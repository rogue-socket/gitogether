# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

v1 and v2 feature-complete, verified end to end with a real GitHub account;
the production build is clean. v1: login, groups (create / invite / join),
GitHub sync, per-group leaderboard, weekly winner recap. v2: copy-invite
button, longest-streak stat, past-weeks history, typed/weighted scoring, and a
public group directory. Not yet done: deployment. See `backlog.md`.

## What gitogether is

A web app where friends form private groups and a leaderboard ranks them on
their GitHub activity — "Strava for committing code." The point is light
competitive pressure that keeps a friend group coding. It is a personal,
casual accountability tool, not a manager dashboard or a global prestige
ladder.

## Stack

- Next.js (App Router) — frontend and API in one codebase
- Auth.js with the GitHub OAuth provider
- SQLite via Prisma — single-file database
- Tailwind CSS
- node-cron — in-process background sync (no separate worker service)
- Deployed as one container (Railway/Fly) with a persistent disk for the
  SQLite file

## Architecture

The core logic — GitHub client, sync, scoring — lives as an internal module
called by Next.js API routes, kept deliberately client-agnostic so a second
client (e.g. a Discord bot) could reuse it later without a rewrite. v1 does
not stand up a separate service.

**GitHub data.** Each user signs in once with GitHub OAuth; their token is
used to read *their own* contribution data via the GraphQL
`contributionsCollection` query. This includes private-repo contribution
counts — but never repo names, which are not requested or stored.

**Sync.** An in-process node-cron job refreshes every user's data every few
hours into the DB. A manual "refresh" button triggers a live fetch for a
single user. The leaderboard always reads from the DB, never live from
GitHub — so it stays fast and survives GitHub downtime. Background sync is
mandatory (not just an optimization): the leaderboard shows all group members
at once, but those members are not online to trigger their own fetches.

**Scoring.** The leaderboard score is "balanced" — weighted output volume plus
a consistency bonus — over the selected time window. It is **computed on read,
never stored** (`computeScore` in `src/lib/score.ts`), so weights can change
without a backfill. Each row shows the type breakdown so a rank feels earned.

`DailyContribution` stores per-day commit / PR / review / issue counts. GitHub
exposes that split only as period totals, not in the daily calendar, so the
sync issues a chunked aliased GraphQL query — one `contributionsCollection`
block per day. `computeScore` weights PRs x3 and reviews x2 over commits and
issues, then adds `CONSISTENCY_BONUS` per active day.

**Leaderboard.** Per group. Window toggles: rolling 7-day (default), month,
all-time. Because daily contributions are stored per day, all three windows
are just different date-range sums over the same rows.

**Winner recap.** A weekly job snapshots each group's completed-week standings
every Sunday midnight and crowns a winner. All-time meta-stats: weeks won,
longest streak.

## Data model (planned)

- `User` — GitHub identity + OAuth token
- `Group` — has an invite code and a `visibility` field (`private` or `public`)
- `Membership` — join table; a user can belong to multiple groups
- `DailyContribution` — one row per user per day; typed commit/PR/review/issue
  counts plus their `contributionCount` total
- `WeeklySnapshot` — frozen standings for the winner recap

## Scope

Built (v1 + v2): GitHub OAuth login; groups (create, invite link, join,
multi-group, private or public); a searchable public directory; background +
manual GitHub sync; per-group leaderboard with week/month/all-time toggles and
typed weighted scoring; longest-streak stat; weekly winner recap with a
past-weeks history view.

Deferred: deployment; Discord bot as a second client; weekly email digest.

## Design rationale worth knowing

- **Web app, not a Discord bot.** A bot was considered and rejected — the user
  finds bots annoying, and a spammy bot repels people from an accountability
  app. The "remember to look" problem is instead meant to be solved later by
  an opt-out weekly email digest, not push pings.
- **Public directory shipped in v2.** Groups can be public and listed in a
  searchable directory; private invite-only groups are still the default.
- **Keep it small.** The user explicitly wants this small, clean, and quick —
  avoid speculative features and extra services. Favor the simplest thing that
  completes the loop.

## Commands

- `npm run dev` — dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build (also type-checks)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check without building
- `npx prisma migrate dev --name <name>` — create and apply a migration
- `npx prisma generate` — regenerate the client (also runs on `postinstall`)
- `npx prisma studio` — browse the local SQLite database

The Prisma client is generated to `src/generated/prisma` (gitignored). The
SQLite file is `dev.db` at the repo root. No test runner is set up yet.

## Session docs

- `handoffs/*` - folder with dated handoff files
- `backlog.md` — living TODO. Tags: `[active]`, `[next]`, `[blocked: <reason>]`, no tag = someday.
- Both gitignored.
