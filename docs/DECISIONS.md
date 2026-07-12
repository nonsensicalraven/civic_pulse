# civicPulse — Decision Log (ADRs)

Format per entry: **Date | Decision | Alternatives considered | Why | Revisit if**

---

## ADR-001: Database — PostgreSQL over MySQL

**Date:** 2026-07-10  
**Decision:** Use PostgreSQL with the PostGIS extension.  
**Alternatives considered:** MySQL (already familiar with basics, faster week-1 ramp).  
**Why:** civicPulse is inherently location-centric — proximity dedup checks (15m radius) and GPS-gated verification (50m radius) are core features, not edge cases. PostGIS's `ST_DWithin` and spatial indexing (GiST) are mature, first-class, and well-documented. MySQL's spatial extensions exist but are less commonly used for this kind of workload, and most real civic-tech OSS projects (e.g. FixMyStreet) use Postgres for this exact reason. The extra ramp-up cost in week 1 is worth it for a project whose whole premise is spatial data.  
**Revisit if:** Geospatial queries turn out to be a minor feature in practice, or hosting/cost constraints make Postgres+PostGIS impractical.

---

### ADR-002: Status modeled as event log, not mutable column

**Date:** 2026-07-12  
**Decision:** `reports` table holds static data only; all status transitions live in an append-only `status_events` table.  
**Alternatives considered:** Single mutable `status` enum column on `reports`, updated in place.  
**Why:** The entire product thesis is "citizens own the resolution status, not a single authority overwriting it." A mutable column can't represent dispute history, can't cheaply answer "how many times was this disputed," and loses the audit trail that gives the dashboard's SLA/fraud-tracking features their data. An append-only log gives this for free and is a legitimate, transferable system design pattern (event sourcing).  
**Revisit if:** Query performance on event history becomes a real bottleneck at a scale this project is unlikely to reach — could add a denormalized `current_status` cache column on `reports` later without abandoning the log.

---

### ADR-003: Photo storage — Cloudinary/S3-compatible, not local disk

**Date:** 2026-07-10
**Decision:** Store uploaded photos in a cloud object store from day one; reference URLs in `status_events.evidence_url`.  
**Alternatives considered:** Local filesystem storage during early development, migrate later.  
**Why:** Docker containers are ephemeral — local disk storage doesn't survive a rebuild, and "migrate later" tends to mean "fight with existing data later." Deciding this in Phase 0 avoids a schema/rewrite cost in week 6.  
**Revisit if:** N/A — low-risk decision, unlikely to need reversal.

---

### ADR-004: Automated social posting deferred out of v1

**Date:** 2026-07-12  
**Decision:** No automated Twitter/X posting of unresolved-issue updates in v1 or the near-term stretch goals.  
**Alternatives considered:** Cron job auto-posting "this pothole has been open 14 days" style updates.  
**Why:** Naming specific officials/contractors as failing, based on crowd-sourced and possibly disputed data, carries real defamation and moderation risk without a mature dispute/moderation layer first. The public dashboard with shareable permalinks achieves most of the same "unignorable pressure" goal without automated public accusations — a journalist or NGO can choose to share it themselves.  
**Revisit if:** The dispute/moderation system (Phase 3) proves robust and a legal/policy review (even informal) suggests the risk is manageable.

---

### ADR-005: Trust points — starting thresholds are placeholders

**Date:** 2026-07-12
**Decision:** Trust point values (1 / 3 / 10) and the verification threshold (tentatively 5) are initial guesses, not tuned.
**Alternatives considered:** Deriving thresholds from real usage data.
**Why:** No usage data exists yet — this is a solo project, not a live product. Starting with simple round numbers is fine; tune later if playtesting with friends/classmates reveals gaming or excessive friction.
**Revisit if:** Phase 2 testing shows the threshold is trivially gameable or unreasonably hard to hit.

---

<!-- Add new entries below this line, newest at the bottom or top — pick one convention and stick with it. -->