# Architecture

_This document will be updated as decisions change._

## 1. High-Level System Overview

```text
┌─────────────┐      ┌───────────────┐      ┌──────────────────┐
│   Client    │  ───►│   API Layer   │ ───► │   PostgreSQL     │
│ (React +    │  ◄───│ (Node/Express)│ ◄─── │   + PostGIS      │
│  Leaflet)   │      │               │      │   (via Prisma)   │
└─────────────┘      └──────┬────────┘      └──────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  Photo storage   │
                    │ (Cloudinary/S3)  │
                    └──────────────────┘
```

## 2. Core Design Decision: Event-Sourced Status, Not Mutable State

Reports do **not** have a simple `status` column that gets overwritten. Instead:

- `reports` table holds static/append-mostly data: location, category, creator, created_at
- `status_events` table is an **append-only log**: every status transition is a new row

```text
status_events
──────────────
id
report_id       (FK → reports)
from_status
to_status
actor_id        (FK → users)
evidence_url    (nullable — photo backing the transition)
created_at
```

**Why:** A report's current status is derived by querying the latest event, not stored redundantly. This gives us, essentially for free:

- Full audit history (who changed what, when, with what evidence)
- `disputeCount` = count of `VERIFIED → PENDING_RESOLUTION → VERIFIED` (dispute) cycles per report
- SLA age calculations = time between `created_at` of `VERIFIED` event and `RESOLVED` event
- Natural fraud-pattern detection later (which reports/actors have unusually high dispute counts)

This is a real pattern (event sourcing) — worth understanding deeply since it recurs in real backend system design.

## 3. State Machine

```text
REPORTED ──► VERIFIED ──► ACKNOWLEDGED ──► PENDING_RESOLUTION ──► RESOLVED
                 ▲                                 │
                 └─────────── disputed ────────────┘
```

Transition rules (enforced server-side, never trusted from client):

| From | To | Trigger | Guard |
| --- | --- | --- | --- |
| REPORTED | VERIFIED | Trust point threshold reached | GPS-gated (50m), role-weighted points |
| VERIFIED | ACKNOWLEDGED | Moderator/verified reporter action | Role check only |
| ACKNOWLEDGED | PENDING_RESOLUTION | Agency/contractor claims resolution | Opens 7-day audit window |
| PENDING_RESOLUTION | RESOLVED | 7 days pass with no dispute + citizen confirmation | GPS-gated |
| PENDING_RESOLUTION | VERIFIED | Citizen dispute with fresh evidence | GPS-gated, increments disputeCount |

## 4. Database Choice: PostgreSQL + PostGIS

See `DECISIONS.md` entry #1 for full reasoning. Short version: geospatial queries (`ST_DWithin` for the 15m dedup check and 50m verification gate) are first-class in PostGIS and awkward in MySQL's spatial extensions. Given this project is inherently location-centric, that tips the scale.

## 5. Trust Point System

Not a boolean "verified/unverified" — a weighted point system:

| Account type | Points per action |
| --- | --- |
| New/anonymous resident | 1 |
| Aged resident (30+ days, 3+ verified reports) | 3 |
| Verified reporter (NGO/RWA, manually vetted) | 10 |

A status transition requiring "verification" fires once cumulative points from distinct nearby actors cross a threshold (exact threshold TBD during Phase 2 — start with something simple like 5, tune later).

## 6. Key Non-Functional Decisions

- **Photo storage**: not local disk (doesn't survive container rebuilds) — Cloudinary or S3-compatible bucket, URL referenced in `status_events.evidence_url`
- **Nominatim usage**: rate-limited to 1 req/sec by the provider — all lookups cached, never called on every keystroke
- **GPS gating**: client sends live coordinates, server validates distance via PostGIS — never trust client-side "you are verified" claims
- **CI**: GitHub Actions runs lint + tests on every push from Phase 0 onward, not retrofitted later

## 7. What's Explicitly Deferred

- Automated social posting (legal risk — see PRD non-goals)
- AI photo classification (stretch, post-v1)
- Passive re-verification cron jobs (stretch, post-v1)
