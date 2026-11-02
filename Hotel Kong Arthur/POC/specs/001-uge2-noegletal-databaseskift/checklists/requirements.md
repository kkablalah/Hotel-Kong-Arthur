# Specification Quality Checklist: Tillægsopgave uge 2: nøgletal i API og frontend samt databaseskift

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-02
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Afklaret 2026-11-02**: FR-009 (to dropdowns og ingen datovælger), FR-013 (tagget `v1-mysql` på `ba5bd83`) og FR-014 (kun startdata i `db/`). Grænserne under Assumptions er godkendt. Se afsnittet Clarifications i spec.md.
- **Bekræftet tolkning**: Gruppen har den 2026-11-02 bekræftet valgmulighederne i de to dropdowns og tabellen "Årsvalg og periodevalg". Det står under Assumptions.
- **Bevidste navne**: REST API, endpoints, OpenAPI, Swagger UI, `docker-compose up`, Tableau og MySQL er nævnt, fordi de er en del af hotellets krav, constitutionen eller systemet, kravene bygger på. PostgreSQL 18 er navngivet, fordi gruppen bad om at få valget registreret, og underviserens bekræftelse afventer.
- **Læser**: Hotellets IT er en af brugerne, så User Story 1, 2 og 4 bruger tekniske ord som statuskode og id. Hotelledelsens krav står i User Story 3 uden dem.
- **Kontrolleret mod data**: Kontroltallene er genberegnet ud fra `db/02_data.sql` i både `ba5bd83` og `4b5e03d` og stemmer. Det er en kontrol af filerne, ikke af det kørende system, som skal verificeres i Converge.
