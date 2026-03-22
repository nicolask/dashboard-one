# Completed Tasks

Reference log of finished work. Not needed in active context — check here when you need to confirm whether something was already done.

---

- **T8** — alert list work superseded by `InsightPanel`; original collapsible `AlertPanel` task is no longer the active path
- **T10** — store detail page and supporting store query layer implemented
- **T11** — placeholder routes for `/users`, `/integrations`, `/settings` implemented
- **T12** — explainable insights replaced the earlier alert-panel surface
- **T13** — period comparison: dynamic `vs. previous Nd` labels on all KPI tiles, conversion delta in pp, revenue growth indicator per store in `StoreRankingTable`
- **T14** — extended store benchmarking: `StoreBenchmarkRow` shows three reference lines per KPI card (network avg, format avg, top 25%); `StoreBenchmark` type extended with `formatAverage`, `topQuartile`, and store-count fields
- **T15** — scenario timeline strip added above the time-range selector on overview and store detail; full seeded-history window is independent of the `days` filter and links store-scoped scenarios to the relevant drilldown
- **T16** — seed scenarios extended with Hamburg traffic surge and München competitor pressure; scenario labels, timeline colours, and insight narratives now cover all four seeded scenarios
- **T17** — test coverage hardening across KPI layer, auth, and key UI components
- **T18a** — controlling schema + deterministic seed: `Employee`, `EmployeeWorkLog`, and `DailyStoreCost` added with a dedicated migration and seed-backed verification
- **T20** — Agentic Audit page at `/agentic`: LOC breakdown, time estimates, speedup comparison, conditions/Einordnung; `snapshot-data.ts` as single update point; three agentic KPI tiles on main dashboard; LOC snapshot SOP at `.agentic/prompts/loc-snapshot.md`
