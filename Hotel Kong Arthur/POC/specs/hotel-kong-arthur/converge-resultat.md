# Resultat af sidste Converge-tjek

**Dato**: 2026-11-01. Kørt mod spec.md, plan.md, tasks.md og constitution v1.1.0.

Verificeret i Docker fra en ren database med `scripts/verificer.ps1`, ud fra en udpakket kopi af den færdige pakke.

## Implementeret

| Område | Krav | Kontrol |
|---|---|---|
| Opstart | FR-13, US-15, constitution V | Fem containere starter med `docker-compose up`, og databasen er sund, før backenden starter |
| Booking-CRUD | FR-01, US-01 til US-04, BR-10 | Tests mod MySQL, også 400, 404 og 409 |
| Live-data | FR-02, US-05 | Test: en ændring ses i næste GET og i nøgletal |
| Belægning | FR-03, US-06, BR-01 | Tests mod kontrolforespørgsler |
| Indtjening pr. type, sæson, land og år | FR-04, FR-05, US-07 til US-09 | Tests mod kontrolforespørgsler. `?aar=2025` giver 11234034,00 DKK |
| Løbende indtjening | FR-05, AC-09.6 | Test: en ny booking tæller med det samme |
| Gæster pr. land | FR-06 | Test mod kontrolforespørgsel |
| Bar | FR-07 til FR-09, US-10 til US-12, BR-07 | Tests mod kontrolforespørgsler. 13448640,34 DKK |
| RevPAR og ADR | FR-10, BR-09 | Test af formlerne |
| Kundetilfredshed | FR-14, US-16, BR-08 | Test af rating og gennemsnit |
| API-kontrakt | FR-12, US-14, constitution III | Kontrakttest i begge retninger, Swagger UI i egen container |
| Sikkerhed og ydeevne | NFR-09, NFR-10 | Test: parametriseret SQL, ingen stack traces, 2 s og 500 ms. Eksporten tog under 2 sekunder |
| Tableau-eksport | FR-02, constitution VIII og IX | `.hyper`-fil dannes hvert 60. sekund, og tallene er aflæst i filen |
| Dokumentation | NFR-05, NFR-08 | `README.md` med diagram, `CONTRIBUTE.md`, `START-HER.md`, `docs/` |

**Testresultat**: 41 af 41 tests bestået mod MySQL 8.0. Alle rækkeantal og kontroltal passer.

## Mangler

| Task | Hvad | Hvem |
|---|---|---|
| T054, T055 | Bygge og kontrollere dashboardet (FR-11, US-13, AC-13.1 til AC-13.6) | Gruppen, i Tableau Desktop |
| T061 | Git-repository og commits fra alle 5 (constitution "Git") | Gruppen |
| T067 | Bekræfte eller afvise CORS for Swagger UI (B-39) | Gruppen |

Frontenden er testet i en simuleret browser, gennem Nginx og i en rigtig browser.

## Antagelser til underviseren

- De 214 værelser er fordelt efter antal ophold pr. type (B-46).
- Kapacitet er hotellets tal, højst 4, så LOFT Suite er 4 mod hotellets 5 (B-47). Det giver plads til 592 gæster, hvor opgaven siger ca. 428.
- Historiske ophold og barsalg hører til 2025 (`HISTORIK_AAR`, B-30, B-32).
- Alt barsalg regnes som Helene Christines (B-32).

## Kendte begrænsninger

- Historiske ophold har ingen datoer, så belægning, RevPAR og ADR bygger kun på nye bookinger.
- Prototypen har bevidst ingen login (NFR-10).
- To samtidige bookinger kan i teorien begge komme igennem dobbeltbooking-tjekket (B-43).
