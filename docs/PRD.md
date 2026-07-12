# Product Requirements Document

## 1. Problem Statement

In Indian cities like Bangalore, citizens already report civic issues — broken footpaths, missing ramps, poor lighting, waterlogging — through apps like BBMP Sahaaya or on social media. The failure isn't in reporting. It's in what happens after:

- **Government-controlled closure**: contractors can mark a ticket "Resolved" with no independent verification, and the citizen has no mechanism to dispute a fake closure.
- **Ephemeral pressure**: social media complaints wash away within a day. There's no persistent, cumulative record of a ward's failures.
- **No structured public data**: no independent ledger exists that NGOs, journalists, or residents can point to as evidence.

## 2. Solution

civicPulse is an independent, citizen-owned public ledger for civic accessibility and safety issues. The core inversion: **the street decides when an issue is resolved, not the contractor.**

Every report moves through a state machine that requires community verification at each step. Fake resolutions can be disputed with photo evidence and rolled back. Ward-level data is aggregated into a public, shareable accountability dashboard.

## 3. Target Users

|User type|Need|
|---|---|
|Resident|Report an issue near them, verify others' reports, dispute fake resolutions|
|Verified Reporter (NGO/RWA member)|Higher-trust actions — faster verification, acknowledgment of agency routing|
|Journalist / NGO researcher|Public, linkable, structured data on ward-level failures|
|Moderator|Light oversight — flag abuse, verify verified-reporter accounts|

## 4. Non-Goals (explicitly out of scope for v1)

- This is **not** a government helpdesk or a replacement for BBMP Sahaaya — it doesn't route tickets to agencies automatically.
- **Not** attempting to be fraud-proof — GPS-gating deters casual gaming, it doesn't prevent a determined bad actor with a spoofed location.
- **Not** launching an automated social-posting bot in v1 — legal/defamation risk is too high without a mature moderation layer first (see `DECISIONS.md`).
- **Not** optimizing for city-wide adoption — this is a portfolio-grade, technically real project. Adoption is a stretch outcome, not the success metric.

## 5. Success Metrics (v1, self-assessed)

Since this isn't a funded product with real users yet, success is measured against learning and completeness, not traction:

- [ ] Full lifecycle (`REPORTED → VERIFIED → ACKNOWLEDGED → PENDING_RESOLUTION → RESOLVED`) is demoable end-to-end in under 2 minutes
- [ ] Dispute/reopen flow works and is tested
- [ ] Ward dashboard shows real aggregated SLA data from seeded reports
- [ ] CI pipeline passes on every merge to `main`
- [ ] Every phase 0–4 feature has at least one automated test
- [ ] I can explain every design decision in `DECISIONS.md` out loud, unaided, in an interview setting

## 6. Feature Scope (v1)

See `docs/ROADMAP.md` (or the GitHub Project board) for the phased breakdown. High-level:

1. **Geo-fenced reporting** — pin drop, photo, category, PostGIS dedup check
2. **Trust-weighted verification** — GPS-gated, role-weighted trust points
3. **Citizen-owned lifecycle** — event-sourced state machine, not a mutable status field
4. **Dispute & reopen subsystem** — 7-day audit window, fraud tracking
5. **Public accountability dashboard** — ward leaderboard, SLA age buckets, shareable permalinks

## 7. Stretch Goals (post-v1, no deadline)

- Passive re-verification prompts (Waze-style "is this still here?")
- Stale-ticket auto-archiving
- AI photo classification (ties into MARVEL/YOLO work)
- Automated social ledger updates — revisit only after moderation maturity

## 8. Open Questions

- How are `verified_reporter` accounts actually vetted, at solo-project scale? (Placeholder: manual approval by project owner for v1.)
- What happens to disputed reports that get disputed repeatedly with no resolution? (Needs a moderator escalation path — design in Phase 3.)
