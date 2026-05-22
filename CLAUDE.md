# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Pre-implementation. The repo currently holds only a README and this file. The
v1 spec below was agreed in a design session; no code has been scaffolded yet.
Once the Next.js app is created, add the build/lint/test commands to the
"Commands" section.

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

**Scoring.** The leaderboard score is "balanced" — two components over the
selected time window: volume (total contributions) and consistency (active
days). It is **computed on read, never stored**, so the formula can change
without a backfill. Each leaderboard row shows the score breakdown so a rank
feels earned rather than arbitrary.

v1 uses GitHub's daily `contributionCount` (one number per user per day). The
commits-vs-PRs-vs-reviews split is intentionally deferred: GitHub only exposes
that split as period totals, not per-day, so typed scoring needs a heavier
sync. Upgrading later is localized — add typed columns to `DailyContribution`
(additive migration) and change the score function. Typed data will only
cover weeks after collection starts; that is acceptable for a weekly board.

**Leaderboard.** Per group. Window toggles: rolling 7-day (default), month,
all-time. Because daily contributions are stored per day, all three windows
are just different date-range sums over the same rows.

**Winner recap.** A weekly job snapshots each group's completed-week standings
every Sunday midnight and crowns a winner. All-time meta-stats: weeks won,
longest streak.

## Data model (planned)

- `User` — GitHub identity + OAuth token
- `Group` — has an invite code and a `visibility` field (private in v1; the
  field exists so a public directory can be added later)
- `Membership` — join table; a user can belong to multiple groups
- `DailyContribution` — one row per user per day (v1: a single count)
- `WeeklySnapshot` — frozen standings for the winner recap

## v1 scope

In: GitHub OAuth login; create group + invite link + join (multi-group,
private); background + manual sync; per-group leaderboard with all three
window toggles; balanced score with visible breakdown; weekly winner recap.

Deferred (post-v1): public/discoverable group directory; Discord bot as a
second client; weekly email digest; typed (weighted) scoring.

## Design rationale worth knowing

- **Web app, not a Discord bot.** A bot was considered and rejected — the user
  finds bots annoying, and a spammy bot repels people from an accountability
  app. The "remember to look" problem is instead meant to be solved later by
  an opt-out weekly email digest, not push pings.
- **Private groups only in v1.** Public discoverable groups drag in moderation
  and spam surface; the `visibility` field is in the schema so they can be
  added without a migration.
- **Keep it small.** The user explicitly wants this small, clean, and quick —
  avoid speculative features and extra services. Favor the simplest thing that
  completes the loop.

## Commands

To be added once the Next.js project is scaffolded (dev server, build, lint,
Prisma migrate/generate, test runner).

## Session docs

- `handoffs/*` - folder with dated handoff files
- `backlog.md` — living TODO. Tags: `[active]`, `[next]`, `[blocked: <reason>]`, no tag = someday.
- Both gitignored.
