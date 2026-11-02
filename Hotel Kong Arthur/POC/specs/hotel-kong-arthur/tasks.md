# Tasks: Hotel Kong Arthur dataanalyse-platform

**Input**: Design-dokumenter fra `/specs/hotel-kong-arthur/` (plan.md — Node.js/Express-backend, spec.md inkl. Clarifications) samt `.specify/memory/constitution.md`

**Prerequisites**: plan.md (læst — teknologivalg: Node.js LTS + Express, mysql2 med rå SQL, contract-first OpenAPI med express-openapi-validator, ren HTML/CSS/JS bag Nginx med `/api`-proxy, eksternt Python-script til Tableau), spec.md (læst — FR-01-14, US-01-16, BR-01-10, C-01-15), constitution.md (læst). Der findes ingen research.md, data-model.md eller contracts/ — opgaver bygger på plan.md afsnit 1-8 (teknologi, kontrakt, arkitektur, datamodel, API-design, Docker, test) samt spec.md.

**Tests**: Test-opgaver er medtaget, fordi constitution ("Kvalitet og Test") og spec (NFR-07 Verifiability) kræver det: nøgletal kontrolleres mod kontrolforespørgsler i databasen, bookingregler testes med edge cases, og OpenAPI-kontrakten valideres mod implementeringen. Test-løsning: Nodes indbyggede test runner (`node --test`) — planens anbefaling, se åbent punkt O-8.

**Organization**: Opgaver er grupperet efter user stories, så hver story kan implementeres og testes uafhængigt. Hver task peger på de acceptkriterier (AC-xx.x) fra spec.md, den hjælper med at opfylde. Kontrakten (openapi/openapi.yaml) skrives altid FØR endpointet implementeres (contract-first, plan afsnit 2).

## Format: `[ID] [P?] [Story] Beskrivelse`

- **[P]**: Kan køres parallelt (forskellige filer, ingen afhængigheder af ufærdige opgaver)
- **[Story]**: Hvilken user story opgaven hører til (US1 = US-01 i spec.md, US13 = US-13, US16 = US-16 osv.)
- Alle opgaver indeholder præcise filstier; kontraktopgaver + fælles test-filer koordineres (se afhængigheder)

## Path-konventioner

- Backend: `backend/src/presentation/` (routes, controllers, app.js, errors.js), `backend/src/business/` (services, validators), `backend/src/data/` (db.js, repositories) — SQL udelukkende i `backend/src/data/repositories/` (constitution princip I)
- Frontend: `frontend/` (ren HTML/CSS/JS) + `frontend/nginx.conf` (`/api` proxy til backend → ingen CORS)
- Kontrakt: `openapi/openapi.yaml` (contract-first, vises af swagger-ui-containeren)
- Database: `db/01_schema.sql` (leveret, struktur) → `02_data.sql` (leveret, data) → `03_extensions.sql` (nye tabeller) → `04_rooms_seed.sql` (de 214 værelser, antagelse) — indlæses automatisk i alfabetisk rækkefølge ved første opstart
- Tableau: `tableau/` — **eksternt Python-værktøj, ikke en del af backenden** (plan afsnit 3)

## User story → fase → prioritet

| User story | Fase | Prioritet | Bemærkning |
|---|---|---|---|
| US-15 (Start systemet) + US-14 (Forstå API'et) | Fase 1 | **P1** | Skelet: kører med `docker-compose up` |
| US-01-US-04 (Booking-CRUD) | Fase 2 | **P1** | Kernefunktion, frontend + API |
| US-05 (Live-data) | Fase 3 | **P1** | Stort set dækket af arkitekturen; verificeres + dokumenteres |
| US-06-US-09 (Hotel-nøgletal) | Fase 4 | **P1** | Kernefunktion |
| US-16 (Kundetilfredshed) | Fase 5 | **P2** | Opgavekrav (FR-14); kan ved tidspres skæres efter kerne-nøgletal |
| US-10-US-12 (Cocktailbar) | Fase 6 | **P2** | Påkrævet af AC-13.2 → skal være færdig før dashboardet færdiggøres |
| FR-10 (Selvvalgt nøgletal) | Fase 7 | **P2** | Påkrævet af AC-13.1 |
| US-13 (Tableau: eksport + dashboard) | Fase 8 | **P1** | Forbindelsen (T050-T053) startes tidligt; dashboard kræver Fase 4-7 |
| Dokumentation + Converge | Fase 9 | **P2** (Converge: **P1**) | NFR-05, NFR-08 og specens Definition of Done kræver Converge-resultat |

**Skæringsorden ved tidspres**: Fase 1 → Fase 2 → Fase 4 → Fase 8 (T050-T053, forbindelsen) → Fase 3 → Fase 5 → Fase 6 → Fase 7 → Fase 8 (T054-T055, dashboard) → Fase 9. Bemærk: dashboardet (T054) kan først færdiggøres, når Fase 5-7 er done, fordi AC-13.1-13.2 kræver alle metrics. Der findes ingen P3-user stories — alle resterende krav er afleveringskrav; dokumentation (T057-T059) gennemføres altid før aflevering (NFR-08).

---

## Fase 1: Setup og skelet (US-15 + US-14, P1) — MVP

**Mål**: Et system, der starter med `docker-compose up`: MySQL med `db/`-filerne, Node-backend med ét endpoint (`GET /api/room-types`) gennem alle tre lag, `/health`, Nginx-frontend med en side der kalder endpointet via `/api`-proxyen, og Swagger UI i egen container. Fundament for alle senere user stories (constitution "Lodrette Dele").

**Uafhængig test**: `docker-compose up` fra en frisk klon → `GET http://localhost:8000/api/room-types` returnerer 200 med værelsestyper → Swagger UI på `http://localhost:8080` viser `openapi/openapi.yaml` → frontend på `http://localhost:3000` viser værelsestyper hentet gennem Nginx-proxien (samme origin, ingen CORS) → `GET /health` returnerer 200 (AC-15.1-15.5, AC-14.1).

### Struktur og konfiguration

- [X] T001 Opret mappestruktur i roden: `backend/src/presentation/routes/`, `backend/src/presentation/controllers/`, `backend/src/business/services/`, `backend/src/business/validators/`, `backend/src/data/repositories/`, `backend/tests/`, `db/`, `frontend/`, `openapi/`, `tableau/`, `extracts/` samt `backend/package.json` med dependencies (express, mysql2, express-openapi-validator, dotenv) og `backend/.nvmrc` med aktuel Node LTS-version (plan afsnit 1 og 4, constitution "Project Structure")
- [X] T002 [P] Opret `.gitignore` i roden med: `.env`, `node_modules/`, `extracts/*.hyper`, `mysql_data/` (constitution princip VI, AC-15.5)
- [X] T003 [P] Opret `.env` og `.env.example` i roden med variablerne `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_ROOT_PASSWORD`, `API_BASE_URL`, `EXPORT_INTERVAL_SECONDS=60` (værdier fra plan afsnit 7; `.env` må ikke committes — constitution princip VI)

### Database

- [X] T004 `db/01_schema.sql` er leveret fra MySQL Workbench og må ikke ændres. Færdig-betingelse: filen indlæses uden fejl efter `docker-compose down -v` og `up` og giver 5 tabeller (countries, drink_categories, drinks, room_types, stays) og 2 views (stays_detailed, drink_sales), uden CREATE DATABASE og USE (spec BR-05, tasks O-14)
- [X] T005 `db/02_data.sql` er leveret fra MySQL Workbench og må ikke ændres. Færdig-betingelse: countries 20, drink_categories 2, drinks 30 (20 + 10), room_types 8, stays 1000; `stay_id = 21` giver Müller; 5379 nætter; værelsesindtjening 11234034,00 DKK; baromsætning 13448640,34 DKK (spec afsnit 6.1-6.2)
- [X] T006 [P] Opret `db/03_extensions.sql` med `rooms`, `bookings` (med `guest_count`, FR-01) og `customer_satisfaction` (FR-14, BR-08) samt `db/04_rooms_seed.sql` med de 214 værelser (antagelse, spec session 2026-11-01). Der indsættes ingen ratings, de indtastes pr. booking (T063, BR-08). Alle antagelser er markeret (spec afsnit 6.3)

### API-kontrakt (contract-first — skrives FØR koden)

- [X] T007 Opret `openapi/openapi.yaml` med grundkontrakten: `GET /health` (200) og `GET /api/room-types` (200, JSON-liste af værelsestyper) med request-/response-skemaer og fælles fejlformat (`error.code`, `error.message`, `error.details` — plan afsnit 6). Alle datoparametre og datofelter er ISO 8601 `YYYY-MM-DD` (OpenAPI-format: `date`); beløb er DKK med 2 decimaler, procenter med 1 decimal (BR-02) (AC-14.1-14.2, constitution princip III)

### Backend-skelet (3 lag — ét endpoint hele vejen igennem)

- [X] T008 [P] Opret `backend/src/data/db.js`: mysql2-pool (preparedStatement) der læser `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` fra miljøvariabler — ingen hårdkodede forbindelsesstrenge (constitution princip VI)
- [X] T009 [P] Opret `backend/src/data/repositories/roomTypeRepository.js` med metode til at hente alle værelsestyper — al SQL ligger i data-laget (constitution princip I)
- [X] T010 [P] Opret `backend/src/business/services/roomService.js` der kalder repositories og returnerer domæneobjekter — ingen HTTP eller SQL i dette lag (constitution princip I)
- [X] T011 Opret `backend/src/presentation/errors.js`: fælles JSON-fejlformat og global fejlhåndtering (uventede fejl → 500 i samme format uden interne detaljer) (plan afsnit 6, AC-14.4)
- [X] T012 Opret `backend/src/presentation/app.js`: Express-app med `GET /health` (200) og express-openapi-validator monteret mod `openapi/openapi.yaml`, så requests/responses der afviger fra kontrakten afvises (contract-first — plan afsnit 2, constitution princip III)
- [X] T013 Opret `backend/src/presentation/routes/rooms.js` og `backend/src/presentation/controllers/rooms.js` med `GET /api/room-types`, `GET /api/rooms` og `GET /api/countries` (200) — presentation kalder kun roomService (AC-15.1, constitution princip II)

### Docker, Nginx og Swagger UI

- [X] T014 [P] Opret `backend/Dockerfile` (Node LTS på slim-base) der installerer dependencies og starter Express-serveren (plan afsnit 1 og 7)
- [X] T015 [P] Opret `frontend/index.html`, `frontend/style.css`, `frontend/app.js` med grundlayout (overskrift, værelsestyper der hentes via `/api/room-types` — kaldet går gennem Nginx-proxien, ikke direkte til port 8000) og `frontend/nginx.conf` med statisk servering + `/api`-proxy til backenden — samme origin, ingen CORS for frontenden (constitution princip VII, AC-15.2, plan afsnit 1)
- [X] T016 Opret `docker-compose.yml` i roden med services: `db` (mysql:8.0, healthcheck `mysqladmin ping`, volume `mysql_data`, `./db` mountet i `/docker-entrypoint-initdb.d/` så 01/02/03-filerne indlæses ved første opstart), `backend` (build `backend/Dockerfile`, healthcheck mod `/health`, `depends_on: db: condition: service_healthy`, port 8000), `frontend` (nginx med `frontend/nginx.conf`, port 3000), `swagger-ui` (swaggerapi/swagger-ui, port 8080, mount `./openapi`), netværk `hk-network` og volumes `mysql_data`, `extracts` — start-rækkefølge og healthchecks fra plan afsnit 7 (AC-15.1, AC-15.4, constitution princip IV og V)

### Verificering af skelettet

- [X] T017 Verificér skelettet fra en frisk klon med `scripts/verificer.ps1`: `docker-compose down -v` (ryd database) → `docker-compose up` → alle containere raske → `GET /api/room-types` og `GET /api/rooms` returnerer 200 → Swagger UI på port 8080 viser kontrakten → frontend på port 3000 svarer gennem proxien → `/health` returnerer 200 → rækkeantal og tal i databasen stemmer med T005, og `rooms` har 214 rækker. Dokumentér resultatet i commit-besked/PR (AC-15.1-15.5, AC-14.1)

**Checkpoint**: Systemet starter med `docker-compose up`, og US-15 + US-14 er opfyldt. Alle senere faser bygger på et startbart system (constitution "Git": main kan altid starte med `docker-compose up`).

---

## Fase 2: Booking-CRUD (US-01 til US-04, P1)

**Mål**: Receptionisten kan oprette, se, rette og slette bookinger via frontend og API, med forretningsvalidering og dobbeltbooking-regel.

**Uafhængig test**: Opret en booking via frontend → den vises i listen → hent via `GET /api/bookings/{id}` → ret den → slet den → 404 ved efterfølgende hentning. Ugyldige input afvises med 400, dobbeltbooking med 409 (AC-01.1-01.4, AC-02.1-02.4, AC-03.1-03.4, AC-04.1-04.4).

### Kontrakt (først)

- [X] T018 [US1] [US2] [US3] [US4] Udvid `openapi/openapi.yaml` med bookings-CRUD: `GET /api/bookings`, `POST /api/bookings` (201/400/409), `GET /api/bookings/{id}` (200/404), `PUT /api/bookings/{id}` (200/400/404/409), `DELETE /api/bookings/{id}` (204/404) med request-/response-skemaer og fejlformat. Booking-skemaet indeholder `guest_count` (FR-01); datofelter er ISO 8601 (`date`), beløb DECIMAL/DKK med 2 decimaler (BR-02) (contract-first, AC-14.2-14.4, constitution princip II og III)

### Backend (lag for lag)

- [X] T019 [P] [US1] Opret `backend/src/data/repositories/bookingRepository.js`: create, get_by_id, list (filtrering på dato/værelse), update, delete, findOverlapping (samme værelse: overlap hvis `ny.check_in < eksisterende.check_out` AND `ny.check_out > eksisterende.check_in` — BR-10, så udtjekning og ny indtjekning samme dag er tilladt) samt findRoomById/findGuestById til eksistens-tjek — al SQL i data-laget (AC-01.1, AC-02.1-02.3, AC-03.1-03.4, AC-04.1-04.3)
- [X] T020 [P] [US1] Opret `backend/src/business/validators/bookingValidator.js`: påkrævede felter, `check_in_date < check_out_date` (mindst én nat, BR-10), `total_price > 0`, `1 <= guest_count <= rooms.capacity` (kapacitet 1-4 fra leveret data; mangler capacity i leveret data → åbent punkt O-15, opfind ikke værdier) (AC-01.3, AC-01.5, AC-03.3, plan afsnit 4)
- [X] T021 [US1] [US2] [US3] [US4] Opret `backend/src/business/services/bookingService.js`: opret (valider incl. guest_count-kapacitet + dobbeltbooking-tjek efter BR-10 → regel-fejl/409), hent (inkl. ikke fundet), liste, opdatér (valider + dobbeltbooking-tjek), slet — regler fra spec FR-01, al logik i business-laget (AC-01.1-01.5, AC-02.1-02.4, AC-03.1-03.4, AC-04.1-04.3)
- [X] T022 [US1] [US2] [US3] [US4] Opret `backend/src/presentation/routes/bookings.js` og `backend/src/presentation/controllers/bookings.js` med de fem endpoints fra T018 — statuskoder pr. kontrakt (AC-01.1-01.4, AC-02.2-02.3, AC-03.4, AC-04.2-04.3, constitution princip II)

### Tests

- [X] T023 [P] [US1] [US2] [US3] [US4] Opret `backend/tests/booking-rules.test.js` med edge-case-tests: dobbeltbooking af samme værelse i overlappende periode → 409 (BR-10); ny booking med check_in = eksisterende check_out samme dag → 201 (tilladt, ingen 409); `check_in >= check_out` → 400; `guest_count < 1` → 400; `guest_count > rooms.capacity` → 400 med fejlbesked (AC-01.5); `total_price <= 0` → 400; ukendt booking-id ved GET/PUT/DELETE → 404; oprettet booking returneres uændret via GET (AC-01.3-01.5, AC-02.3, AC-03.3-03.4, AC-04.3, plan afsnit 8)

### Frontend (sekventielle — samme filer)

- [X] T024 [US2] Udvid `frontend/app.js` og `frontend/index.html`: bookingsliste der hentes via `GET /api/bookings` (gennem Nginx-proxien) og genindlæses ved ændring (AC-02.1, AC-02.4)
- [X] T025 [US1] Udvid `frontend/app.js`: opret-formular (værelse, gæst, guest_count, datoer, pris) der poster til `POST /api/bookings` og viser valideringsfejl fra API'et (AC-01.1-01.3, AC-01.5)
- [X] T026 [US3] Udvid `frontend/app.js`: redigér-funktion på hver række (`PUT /api/bookings/{id}`) med visning af valideringsfejl (AC-03.1-03.3)
- [X] T027 [US4] Udvid `frontend/app.js`: slet-funktion med bekræftelsesdialog der tydeligt identificerer den booking der slettes (`DELETE /api/bookings/{id}`) (AC-04.1, AC-04.4)

**Checkpoint**: US-01-US-04 kan demonstreres uafhængigt i browser + Swagger UI, og bookingreglerne er testet.

---

## Fase 3: Live-data (US-05, P1)

**Mål**: Nye og ændrede data er tilgængelige via API uden genimport af historisk dataset — live efter Clarifications C-01 (en ændring via POST/PUT/DELETE er synlig i næste GET-kald, uden caching; Tableau-eksporten kører hvert 60. sekund) — og definitionen er dokumenteret og verificeret.

**Uafhængig test**: Opret/ret en booking via API under kørsel → data afspejles straks i efterfølgende API-hentninger og i nøgletal (AC-05.1-05.3).

- [X] T028 [US5] Opret `backend/tests/live-data.test.js`: opretter en booking via POST → henter den i næste GET-kald → opdaterer den → verificerer at opdateringen returneres, og at ingen caching sidder imellem (når Fase 4 er færdig: verificér også at bookingen indgår i metrics). Færdig-betingelse: test grøn med `node --test` (AC-05.1-05.3, Clarifications C-01, plan afsnit 6 "Live-data")
- [X] T029 [US5] Dokumentér i `README.md`: definitionen af "live" (ændring via POST/PUT/DELETE synlig i næste GET-kald, uden caching — C-01), at Tableau-eksporten kører hvert 60. sekund (`EXPORT_INTERVAL_SECONDS=60`), samt hvordan det verificeres i `backend/tests/live-data.test.js` (AC-05.4)

**Checkpoint**: US-05 er verificeret og dokumenteret. (Kravet dækkes arkitekturmæssigt af Fase 1-2 — ingen cache-egenskab skal bygges; denne fase verificerer og dokumenterer det.)

---

## Fase 4: Hotel-nøgletal (US-06 til US-09, P1)

**Mål**: Belægningsgrad, indtjening pr. værelsestype pr. sæson, indtjening pr. land, gæster pr. land og årets indtjening beregnes i backenden og udstilles via API — inkl. identifikation af de højest indtjenende værelsestyper og lande. Nøgletal beregnes i business-laget, al SQL i data-laget (constitution princip I og VIII).

**Uafhængig test**: Hvert nøgletal kan kaldes via sit endpoint med en periode/parametre og tjekkes mod en kontrolforespørgsel direkte i databasen med samme parametre (NFR-06, NFR-07).

### Kontrakt (først)

- [X] T030 [US6] [US7] [US8] [US9] Udvid `openapi/openapi.yaml` med: `GET /api/metrics/occupancy` (start_date, end_date), `GET /api/metrics/revenue` (start_date, end_date valgfri, group_by: type/season/country/year/type_season), `GET /api/metrics/revenue/annual` (`aar` valgfri; standard = `HISTORIK_AAR`, BR-04), `GET /api/metrics/revenue/running` (løbende indtjening fra nye bookinger), `GET /api/metrics/guests/countries` (start_date, end_date) — med skemaer og statuskoder 200/400/404. Datoparametre er ISO 8601 `date`; beløb DKK/2 decimaler, procenter 1 decimal (BR-02) (contract-first, AC-14.2, plan afsnit 6)

### Backend (lag for lag)

- [X] T031 [P] [US7] Opret `backend/src/business/season.js`: sæsonklassifikation af datoer — High (1. jun-31. aug + 20. dec-5. jan), Mid (1. apr-31. maj + 1. sep-31. okt), Low (6. jan-31. mar + 1. nov-19. dec) — BR-03, inkl. overgangen ved årsskiftet (AC-07.5)
- [X] T032 [P] [US6] Opret `backend/src/data/repositories/occupancyRepository.js`: SQL der beregner belagte værelsesnætter pr. datointerval — en nat på dato d tæller, hvis `check_in <= d < check_out` (udtjekningsdagen tæller ikke), kun aktive (ikke-slettede) bookinger (BR-01; tilgængelige nætter = 214 × antal nætter i perioden — C-05 afgjort) (AC-06.1)
- [X] T033 [P] [US7] [US8] [US9] Opret `backend/src/data/repositories/revenueRepository.js`: SQL for omsætning fra `stays` (grupperet pr. værelsestype, land og sæson) og fra `bookings`; summer pr. gruppe, sortering, sæson for bookinger og årstal beregnes i business-laget (constitution princip I, BR-02, BR-04) (AC-07.1-07.2, AC-07.4, AC-08.1, AC-08.3, AC-09.1)
- [X] T034 [P] [US8] Opret `backend/src/data/repositories/guestsRepository.js`: SQL for antal gæster pr. land og omsætning pr. land — rækker uden kendt land vises som kategorien "Ukendt" og tæller med i totaler (AC-08.1, AC-08.4)
- [X] T035 [US6] [US7] [US8] [US9] Opret `backend/src/business/services/metricsService.js`: metoder for occupancy (belagte nætter / (214 × nætter i perioden), pct. med 1 decimal), revenue med `group_by` (type/season/country/year), annual revenue (`aar`-parameter med standard seneste komplette år; året identificeret i resultatet) og guests by country; håndtering af perioder uden data (defineret nul-/tomværdi eller fejlbesked — ikke misvisende procent) (AC-06.1-06.4, AC-07.3, AC-08.2, AC-09.2-09.4, BR-01, BR-04)
- [X] T036 [US6] [US7] [US8] [US9] Opret `backend/src/presentation/routes/metrics.js` og `backend/src/presentation/controllers/metrics.js`: de fire GET-endpoints fra T030 (`aar`-parameter på annual; datoparametre ISO 8601) — 200/400/404 pr. kontrakt (AC-06.2, AC-07.3, AC-08.2, AC-09.2)

### Tests

- [X] T037 [P] [US6] [US7] [US8] [US9] Opret `backend/tests/metrics.test.js`: for hvert nøgletal beregnes værdien via API og sammenlignes med en kontrolforespørgsel direkte mod databasen med samme parametre og ROUND — tolerance 0,01 DKK for beløb og 0,1 procentpoint for procenter (BR-02); belægning kontrolleres præcist mod BR-01 (belagte nætter / (214 × nætter), ikke bookinger/værelser). Desuden tests for tom periode, standard-året (uden `aar`-parameter), "Ukendt"-kategorien ved manglende land og konsistens ved gentagen beregning (AC-06.3-06.4, AC-07.4, AC-08.3-08.4, AC-09.3-09.4, plan afsnit 8, NFR-07)

**Checkpoint**: US-06-US-09 er uafhængigt testbare via Swagger UI og kontrolforespørgsler.

---

## Fase 5: Kundetilfredshed (US-16, P2)

**Mål**: Gennemsnitlig kundetilfredshed (rating 1-5, BR-08) for en valgt periode, beregnet i backenden og klar til dashboard (FR-14).

**Uafhængig test**: `GET /api/metrics/satisfaction` for en periode med kendte demodata returnerer gennemsnittet af `customer_satisfaction`-rækkerne for perioden; tom periode giver defineret tomværdi (AC-16.1-16.4).

- [X] T038 [US16] Udvid `openapi/openapi.yaml` med `GET /api/metrics/satisfaction` (start_date, end_date; 200/400) (contract-first, AC-14.2, plan afsnit 6)
- [X] T039 [P] [US16] Opret `backend/src/data/repositories/satisfactionRepository.js`: SQL for gennemsnitlig rating (1-5) for et datointerval — kun ratings knyttet til eksisterende bookinger (BR-08); perioder uden ratings returnerer defineret tomværdi (AC-16.1, AC-16.4)
- [X] T040 [US16] Udvid `backend/src/business/services/metricsService.js` med satisfaction-metode: gennemsnit pr. periode med periode-identifikation i resultatet (AC-16.1-16.3)
- [X] T041 [US16] Udvid `backend/src/presentation/routes/metrics.js` og controllers med `GET /api/metrics/satisfaction` (200/400) (AC-16.2)
- [X] T042 [P] [US16] Udvid `backend/tests/metrics.test.js` (koordinér med T037 — samme fil): gennemsnitlig rating via API sammenlignes med kontrolforespørgsel mod `customer_satisfaction` for samme periode, inkl. test af tom periode (AC-16.3-16.4, NFR-07)
- [X] T063 [US16] Tilføj `POST /api/bookings/{id}/satisfaction` gennem alle tre lag og en ratingformular i `frontend/` (rating 1-5 og valgfri kommentar). Rating uden for 1-5 → 400, ukendt booking → 404 (FR-14, AC-16.5, BR-08). Tilføjet 2026-11-01, fordi der ikke må opfindes ratings

**Checkpoint**: US-16 er implementeret, testet og klar til Tableau (AC-13.1).

---

## Fase 6: Cocktailbar (US-10 til US-12, P2)

**Mål**: Samlet salg for Helene Christine pr. år (bardata hører til `HISTORIK_AAR`, BR-06), omsætning pr. drink og procentfordeling mellem cocktails og kaffe.

**Uafhængig test**: Kald de tre cocktail-endpoints og tjek mod kontrolforespørgsler i databasen (AC-10.4, AC-11.4, AC-12.5).

- [X] T043 [US10] [US11] [US12] Udvid `openapi/openapi.yaml` med `GET /api/cocktail/sales`, `GET /api/cocktail/sales/products`, `GET /api/cocktail/sales/distribution` (`aar` valgfri; standard = `HISTORIK_AAR`, andre år giver 404, BR-06) — distribution returnerer **både** omsætningsandel (hovedtal) og enhedsandel pr. kategori, procenter med 1 decimal (BR-07) (contract-first, AC-14.2, plan afsnit 6)
- [X] T044 [P] [US10] [US11] [US12] Opret `backend/src/data/repositories/cocktailRepository.js`: SQL der henter drikke med kategori, pris og solgte enheder fra `drinks`. Omsætning og begge andele beregnes i business-laget. Alt salg regnes som Helene Christines og hører til `HISTORIK_AAR` (BR-06, BR-07) (AC-10.1, AC-11.1, AC-12.1, AC-12.3-12.4)
- [X] T045 [US10] [US11] [US12] Opret `backend/src/business/services/cocktailService.js`: total for Helene Christine pr. år, revenue by drink (top-produkt kan identificeres), procentfordeling pr. kategori med omsætningsandel som hovedtal og enhedsandel som supplement — begge dokumenteret i kodekommentar og README (BR-07, BR-02: procenter med 1 decimal) (AC-10.1-10.3, AC-11.1-11.4, AC-12.1-12.5)
- [X] T046 [US10] [US11] [US12] Opret `backend/src/presentation/routes/cocktail.js` og `backend/src/presentation/controllers/cocktail.js`: de tre GET-endpoints fra T043 — 200/400 (AC-10.2, AC-11.2, AC-12.2)
- [X] T047 [P] [US10] [US11] [US12] Opret `backend/tests/cocktail.test.js`: kontrolberegninger mod databasen for alle tre nøgletal med ROUND (tolerance 0,01 DKK / 0,1 procentpoint, BR-02), inkl. årstalsidentifikation i resultatet, begge fordelingsandele (omsætning og enheder) og test af standard-året (AC-10.2-10.4, AC-11.3-11.4, AC-12.3-12.5)

**Checkpoint**: US-10-US-12 er uafhængigt testbare og klar til Tableau (AC-13.2).

---

## Fase 7: Selvvalgt nøgletal (FR-10, P2)

**Mål**: Det selvvalgte nøgletal **RevPAR** (BR-09: total rum-omsætning / (214 × nætter i perioden)) med **ADR** (total rum-omsætning / belagte værelsesnætter) som supplement, implementeret gennem alle tre lag og præsenteret i Tableau (FR-10, O-3 afgjort 2026-10-29). Føder AC-13.1.

**Uafhængig test**: RevPAR og ADR kan hentes via deres endpoints og verificeres mod kontrolberegninger i databasen (BR-09, NFR-07).

- [X] T048 [US13] Dokumentér nøgletallerne i `specs/hotel-kong-arthur/notes.md` og `README.md`: RevPAR = total rum-omsætning (BR-02) / (214 × nætter i rapporteringsperioden) med forretningsformål og periode, samt ADR = total rum-omsætning / belagte værelsesnætter (BR-09, FR-10 — valget er truffet, se Clarifications C-12)
- [X] T049 [US13] Implementér RevPAR og ADR gennem alle tre lag: SQL i `backend/src/data/repositories/` (ny fil eller udvidelse af `revenueRepository.js`), beregning i `backend/src/business/services/metricsService.js`, endpoints i `backend/src/presentation/routes/metrics.js`, udvid `openapi/openapi.yaml` (samme commit — constitution princip III) og kontroltest i `backend/tests/metrics.test.js` (tolerance 0,01 DKK / 0,1 procentpoint) (FR-10, AC-13.1, BR-09, NFR-07)

**Checkpoint**: Det selvvalgte nøgletal er dokumenteret, implementeret, testet og klar til Tableau.

---

## Fase 8: Tableau — eksport og dashboard (US-13, P1)

**Mål**: Det eksterne Python-script (`tableau/` — ikke en del af backenden, plan afsnit 3) henter data fra backendens REST API og skriver en `.hyper`-fil til `extracts/` (monteret på værtsmaskinen); Tableau Desktop åbner filen og viser et interaktivt dashboard med alle nøgletal. Nøgletal er beregnet i backenden, ikke i Tableau (constitution princip VIII). Bemærk: Hyper API findes ikke til Node.js — Python-scriptet er en begrundet undtagelse fra princip IX (åbent punkt O-9).

**Uafhængig test (eksporten)**: `docker-compose up` → `extracts/tableau_data.hyper` dannes og kan åbnes i Tableau Desktop med alle tabeller. **Uafhængig test (dashboard)**: dashboardet viser alle metrics fra AC-13.1-13.2, kan filtreres, og værdierne stemmer med API'et (AC-13.1-13.6).

- [X] T050 [P] [US13] Opret `tableau/requirements.txt` (tableauhyperapi, requests) og `tableau/Dockerfile` (python:3.11-slim) — eksternt værktøj, adskilt fra backenden (plan afsnit 3)
- [X] T051 [P] [US13] Opret `tableau/hyper_extract.py`: henter data fra endpoints `/api/metrics/occupancy`, `/api/metrics/revenue`, `/api/metrics/revenue/annual`, `/api/metrics/revenue/running`, `/api/metrics/guests/countries`, `/api/metrics/satisfaction`, `/api/metrics/revpar`, `/api/cocktail/sales`, `/api/cocktail/sales/products`, `/api/cocktail/sales/distribution`, `/api/bookings` (`API_BASE_URL` fra miljøvariabel) og skriver tabeller til en `.hyper`-fil via tableauhyperapi med midlertidig fil + atomisk omdøbning til `EXTRACT_OUTPUT_PATH`; scriptet gentages med fast interval fra miljøvariablen `EXPORT_INTERVAL_SECONDS=60` (loop, ikke cron — plan afsnit 3.1, C-14/AC-05.4) og holder sig under 30 sekunder pr. eksport (NFR-09)
- [X] T052 [US13] Udvid `docker-compose.yml` med `tableau-export`-servicen: build `tableau/Dockerfile`, volume `./extracts` (monteret på værten, så Tableau Desktop kan åbne filen), miljøvariabler `API_BASE_URL`/`EXTRACT_OUTPUT_PATH`/`EXPORT_INTERVAL_SECONDS=60`, `depends_on: backend: condition: service_healthy`. Servicen starter med `docker-compose up` (constitution princip V)
- [X] T053 [US13] Test ekstraktionen: `docker-compose up` → verificér at `extracts/tableau_data.hyper` dannes, opdateres atomisk ved gentagen kørsel, og kan åbnes i Tableau Desktop med alle tabeller (AC-13.6)
- [ ] T054 [US13] Opret Tableau-dashboard i `tableau/dashboard/hotel_dashboard.twbx`: visualiseringer af gæster pr. land, indtjening pr. værelsestype/sæson/land, årlig indtjening, belægningsgrad over tid, gennemsnitlig kundetilfredshed (FR-14), RevPAR og ADR (FR-10, BR-09), løbende indtjening fra nye bookinger, Helene Christines salg pr. år, omsætning pr. drink og cocktail-/kaffefordeling (både omsætnings- og enhedsandel, BR-07) — med filtre på periode, kategori og land, og tydelig identifikation af metric og rapporteringsperiode (AC-13.1-13.4)
- [ ] T055 [US13] Verificér dashboardet: sammenlign mindst ét vist nøgletal pr. visualisering med API/kontrolberegning (SQL med ROUND; tolerance 0,01 DKK for beløb og 0,1 procentpoint for procenter — BR-02, AC-13.5), og dokumentér dashboardets opdateringsadfærd (eksport hvert 60. sekund, `EXPORT_INTERVAL_SECONDS=60`, + manuel genindlæsning af datakilden i Tableau) i `README.md` (AC-13.6, C-14)

**Checkpoint**: US-13 kan demonstreres: script → `.hyper` → dashboard → tal stemmer med API.

---

## Fase 9: Dokumentation og Converge (P2; Converge-tjek er P1)

**Mål**: Dokumentation der gør systemet reproducerbart og forståeligt (NFR-05, NFR-08), kontrakt-tjek der sikrer kontrakt og kode i sync (constitution princip III), samt et Converge-resultat der lister implementeret vs. mangler (spec afsnit 11).

- [X] T056 [P] Opret `backend/tests/contract.test.js`: går `openapi/openapi.yaml` igennem og verificerer at hvert dokumenteret endpoint har en registreret route i Express-appen — og at hver registreret route er dokumenteret; verificerer desuden at fejlresponses følger det dokumenterede fejlformat (AC-14.3-14.4, plan afsnit 8 "Test af kontrakt-match", constitution princip III)
- [X] T057 [P] Opret `README.md`: arkitekturdiagram (3 lag + containere + tableau-export som eksternt værktøj), forudsætninger, opsætning og `docker-compose up`, API-basis-URL og Swagger UI (port 8080), live-definition (C-01: næste GET uden caching; eksport hvert 60. sekund, `EXPORT_INTERVAL_SECONDS=60`), Tableau-ekstrakt med opdateringsinterval og begrænsningen ift. real-time (plan afsnit 3.3), prototypens bevidste svagheder (ingen login/roller — NFR-10) (NFR-05, NFR-08)
- [X] T058 [P] Opret `CONTRIBUTE.md`: feature-branches, små commits med meningsfulde beskeder, review af mindst ét medlem før merge, main skal altid kunne starte med `docker-compose up`, og OpenAPI opdateres i samme commit som API-ændringer (constitution "Git" og princip III, NFR-08)
- [X] T059 [P] Opret `docs/ai-decisions.md`: noter over vigtige AI-foreslåede arkitekturbeslutninger (Node.js/Express, contract-first, Hyper Extract-script med Python-undtagelsen, den fjernede profil-afvigelse, RevPAR/ADR-valget) med begrundelse for beholdt/ændret valg (constitution "Ejerskab og AI")
- [X] T060 Kør Converge-tjek (skill `speckit-converge`): sammenlign implementeringen mod spec.md, plan.md og denne tasks.md, og producér en liste over hvad der er implementeret og hvad der mangler (spec afsnit 11 "Definition of Done", sidste punkt). Opdatér checkbox-status i denne fil undervejs
- [ ] T061 Kør `git shortlog -sn` og verificér at alle 5 gruppemedlemmer har commits under eget navn (constitution "Git": alle 5 skal committe). Konstateres afvigelser, noteres det i Converge-resultatet (T060)
- [X] T062 Opret `backend/tests/security-performance.test.js`: (1) SQL-injektion-lignende input (fx `'; DROP TABLE bookings;--` i gæstenavn og datofelter) behandles som almindelig tekst — anmodningen afvises med 400 eller gemmes uskadt, tabellerne er uændrede og der opstår ingen databasefejl; (2) fejlsvar indeholder ingen stack traces eller interne detaljer; (3) svartider på demodatasættet: metrics-endpoints < 2 sekunder, booking-CRUD < 500 ms (`.hyper`-eksporten < 30 sekunder verificeres manuelt i T053) (NFR-09, NFR-10, plan afsnit 8)

**Checkpoint**: Projektet er dokumenteret, kontrakten er verificeret mod koden, og Converge-resultatet findes.

---

## Afhængigheder og kørselsrækkefølge

### Faser

- **Fase 1 (Skelet)**: Ingen forudsætninger. Blokerer alt andet — main skal altid kunne starte med `docker-compose up`. Bemærk rækkefølge internt: T007 (kontrakt) før T012 (validator monteres); T004-T006 før T016 (compose mounter `db/`); T008-T013 før T014/T016.
- **Fase 2 (Booking-CRUD)**: Afhænger af Fase 1 (T004: bookings/gæster-tabeller; T008: db.js). T018 (kontrakt) før T022 (routes); T019-T020 før T021; T021 før T022; T023 kan skrives parallelt men afvikles efter T022. Frontend T024-T027 er sekventielle (samme filer).
- **Fase 3 (Live)**: Afhænger af Fase 2 (T028 tester bookings-flowet). T028 færdiggøres efter Fase 4 (metrics-verifikation); T029 kan løbende.
- **Fase 4 (Hotel-nøgletal)**: Afhænger af Fase 1 (T004-T006: bookings/gæster-data). Kan køres parallelt med Fase 2 af forskellige medlemmer — repositories (T032-T034) og season.js (T031) rører ikke booking-filerne; T030 (kontrakt) koordineres med T018 (samme fil — kør på tur). T035 afhænger af T031-T034; T036 af T035; T037 afvikes efter T036 og efter Fase 2 er merget.
- **Fase 5 (Kundetilfredshed)**: Afhænger af Fase 4 (metricsService.js og routes/metrics.js findes fra T035/T036). T042 rører `metrics.test.js` (samme fil som T037) — kør efter T037.
- **Fase 6 (Cocktailbar)**: Afhænger af Fase 1 (T004-T005: `drinks` og `drink_categories`). Kan køres parallelt med Fase 2, 4 og 5 — alle nye filer. T043 (kontrakt) koordineres med T018/T030.
- **Fase 7 (Selvvalgt nøgletal)**: Afhænger af Fase 4 (metricsService/routes findes) og af beslutningen i T048 (åbent punkt O-3).
- **Fase 8 (Tableau)**: T050-T052 kan påbegyndes efter Fase 1 (scriptet skrives mod kontraktens endpoint-liste), men T053-T055 kræver Fase 4-7 færdige (alle metrics-endpoints + selvvalgt nøgletal + satisfaction + cocktail).
- **Fase 9**: T056-T059 kan løbende påbegyndes (T056 tidligst efter Fase 2); T060 kræver alt andet færdigt.

### Parallellisering (5 medlemmer — ingen samme filer)

Efter Fase 1 er færdig kan fem medlemmer arbejde samtidig:

| Medlem | Opgaver | Filer |
|---|---|---|
| A | Fase 2: booking-CRUD igennem alle lag + frontend (T018-T027) | openapi.yaml (på tur), bookingRepository.js, bookingValidator.js, bookingService.js, routes/bookings.js, controllers/bookings.js, booking-rules.test.js, frontend/ |
| B | Fase 4: occupancy + service + endpoints (T030, T032, T035-T037) | occupancyRepository.js, metricsService.js, routes/metrics.js, controllers/metrics.js, metrics.test.js |
| C | Fase 4: revenue + season (T031, T033) | season.js, revenueRepository.js |
| D | Fase 4: gæster/land (T034) + Fase 6: cocktail (T043-T047) | guestsRepository.js, cocktailRepository.js, cocktailService.js, routes/cocktail.js, controllers/cocktail.js, cocktail.test.js |
| E | Fase 8: Tableau-script (T050-T052) + Fase 9 (T057-T059) | tableau/, README.md, CONTRIBUTE.md, docs/ |

Bemærk: T035/T036 (medlem B) og senere T040/T041 (Fase 5) og T049 (Fase 7) rammer alle `metricsService.js`/`routes/metrics.js` — B skaber filerne, og Fase 5/7 udvider dem bagefter (ikke parallelt med B). T042 og T037 deler `metrics.test.js` — T042 efter T037.

**Procedure ved `openapi/openapi.yaml` (afgjort 2026-10-29):** kun ét gruppemedlem redigerer filen ad gangen — aftales i gruppens chat, `git pull` før redigering, små commits. Ved merge-konflikt: den med den senere ændring løser konflikten og **kører kontrakttesten (T056) og hele `node --test`**, før der merges. Kontraktopgaverne (T007, T018, T030, T038, T043, T049-kontrakt) følger denne procedure.

### Rækkefølge inden for hver fase

- Kontrakt → repositories/validators → services → routes/controllers → tests → frontend. SQL udelukkende i `backend/src/data/repositories/`; forretningsregler og nøgletalsberegninger udelukkende i `backend/src/business/`; HTTP udelukkende i `backend/src/presentation/` (constitution princip I).
- Frontend-opgaver i Fase 2 er sekventielle (T024 → T025 → T026 → T027 — samme filer).

---

## Implementeringsstrategi

### MVP (hvis tiden kniber)

1. Fase 1 færdig (T001-T017) — systemet kører med `docker-compose up`
2. Fase 2 færdig (T018-T027) — booking-CRUD i browser
3. Fase 4 færdig (T030-T037) — hotel-nøgletal via API
4. Fase 8: eksport-forbindelsen (T050-T053) — `.hyper`-fil dannes og åbnes i Tableau
5. Fase 3 (T028-T029) — live verificeret/dokumenteret
6. Fase 5 (T038-T042) og Fase 6 (T043-T047) — P2, men påkrævet af AC-13.1-13.2
7. Fase 7 (T048-T049) — P2, påkrævet af AC-13.1
8. Fase 8: dashboard (T054-T055) — kræver Fase 5-7
9. Fase 9: T056-T059 før aflevering (NFR-08); T060 (Converge) er altid påkrævet

### Inkrementel levering

Hver fase efterlades i en tilstand, hvor `docker-compose up` stadig virker, og merge til main sker først efter review (constitution "Git"). Commit efter hver task eller logisk gruppe; OpenAPI ændres i samme commit som API-ændringer (constitution princip III).

---

## Åbne punkter (opfind ikke krav)

**Beslutningsfrist for alle åbne punkter: fredag den 30/10.** Uden beslutning inden fristen gælder **standardvalget**. Ejer = gruppemedlem jf. parallelliseringsplanen (A: booking/reference, B: occupancy/service/endpoints, C: revenue/season, D: guests/cocktail, E: tableau/dokumentation).

### Afgjorte punkter (godkendt 2026-10-29 — registreret i spec/plan/constitution)

- **O-2 Fordelingsmetode cocktail/kaffe (BR-07, C-11)**: **AFGJORT** — begge andele: omsætningsandel som hovedtal + enhedsandel (BR-07). Lukket i T043-T047.
- **O-3 Selvvalgt nøgletal (FR-10, C-12)**: **AFGJORT** — RevPAR (BR-09) med ADR som supplement. Lukket i T048-T049.
- **O-4 Årstal (C-07)**: **AFGJORT** — `?aar=`-parameter med standard = seneste år med komplette data (BR-04). Lukket i T030/T033/T035-T037.
- **O-5 Tableau-opdateringsinterval (C-14)**: **AFGJORT** — 60 sekunder (`EXPORT_INTERVAL_SECONDS=60`). Lukket i T051/T052/T055.
- **O-6 Belægning (C-05)**: **AFGJORT** — formel og antagelser er skrevet ind i spec.md BR-01 (belagte nætter / (214 × nætter); kun aktive bookinger; `[check_in, check_out)`). T032 følger BR-01; dokumenter i README ved T037.
- **O-9 Princip IX-undtagelse (Python-script)**: **AFGJORT** — undtagelsen er skrevet ind i constitution princip IX (v1.1.0, godkendt 2026-10-29) med betingelserne: eksternt værktøj, egen container, ingen forretningslogik, ingen databaseadgang. T050-T052 kan implementeres.
- **O-11 Profil-afvigelse ("én kommando")**: **AFGJORT 2026-11-01** — profilen er fjernet, og `tableau-export` starter med `docker-compose up` (T064, constitution princip V).

### Åbne punkter med ejer, blokering, standardvalg og frist

| ID | Emne | Ejer | Blokerer | Standardvalg (uden beslutning inden 30/10) | Status |
|---|---|---|---|---|---|
| O-1 | Værelsesfordeling pr. type (BR-05, C-08) | A | T005, metrics-tests | Fordeling efter ophold pr. type i `db/04_rooms_seed.sql` (antagelse til underviser) | Afgjort 2026-11-01 |
| O-7 | Manglende historiske data (C-13) | D | T044, cocktail-tests | Alt barsalg regnes som Helenes, og `stays` hører til `HISTORIK_AAR` (antagelser) | Afgjort 2026-11-01 |
| O-8 | Teknologivalg: Express vs. Fastify, Knex, `node --test` vs. Jest | B | T001 (package.json), T007-T013, alle test-tasks | Planens anbefalinger: Express, mysql2 uden Knex, `node --test` — tasks er skrevet ud fra dem | Åben — frist 30/10 |
| O-10 | Reservemetode: direkte MySQL fra Tableau (plan afsnit 3.4, konflikt med constitution VIII) | E | Intet (der findes ingen task) — men **må ikke implementeres uden godkendelse** | Implementeres ikke; forbliver dokumenteret afvigelse; bruges den alligevel, noteres det i Converge (T060) | Åben — frist 30/10 |
| O-12 | Demodata-omfang | C | T006, metrics-tests | Ingen demodata. Værelser er en antagelse, og ratings indtastes (T063) | Afgjort 2026-11-01 |
| O-13 | Ressourcesprog i API'et: engelsk (`/api/rooms`, `/api/bookings`) eller dansk | B | T007, T013, T018, T030 (openapi + routes) | Engelsk (planens anbefaling; tasks følger det) | Åben — frist 30/10 |
| O-14 | `db/` og planens datamodel | A | T004-T006 | `db/01` og `02` er leveret, og planens datamodel følger dem | Afgjort 2026-11-01 |
| O-15 | `rooms.capacity` (FR-01) | A | T020, T023, AC-01.5 | Hotellets maksimum pr. type, højst 4, så LOFT Suite er 4 (hotellet oplyser 5) | Afgjort 2026-11-01 |

---

## Notes

- [P]-opgaver = forskellige filer, ingen afhængigheder af ufærdige opgaver.
- [USx]-mærket peger på user story US-0x i spec.md; AC-referencer peger på acceptkriterier.
- Kontrakten (`openapi/openapi.yaml`) skrives altid FØR endpointet (contract-first); express-openapi-validator (T012) afviser requests/responses der afviger — kontrakt og kode holdes dermed i sync fra dag ét (constitution princip III).
- `tableau/` er et eksternt værktøj (Python) — intet Python i `backend/` (constitution princip IX, plan afsnit 3).
- Verificér at hver opgaves færdig-betingelse er opfyldt (checkbox + test kører), før den markeres færdig — det er grundlaget for Converge-tjekket (T060).
- Commit efter hver opgave; main skal altid kunne starte med `docker-compose up`.
- Undgå: vage opgaver, samme fil i parallelle opgaver, kryds-story-afhængigheder der bryder uafhængighed, SQL uden for data-laget.

## Phase 10: Convergence

- [X] T064 CRITICAL: Lad `tableau-export` starte med `docker-compose up` i stedet for bag profilen `extract` per Constitution V og FR-02 (contradicts)
- [X] T065 Bloker adgang til `/nginx.conf`, som frontenden ellers udleverer som en statisk fil, per plan: frontend i Nginx (unrequested)
- [X] T066 Ret plan afsnit 7, 9 og 10 samt T052 og O-11, så de ikke længere beskriver profilen, per Constitution V (partial)
- [ ] T067 Gruppen bekræfter eller afviser CORS for Swagger UI (`docs/beslutninger.md`, B-39), som afviger fra planens "ingen CORS", per plan: CORS-håndtering (unrequested)
