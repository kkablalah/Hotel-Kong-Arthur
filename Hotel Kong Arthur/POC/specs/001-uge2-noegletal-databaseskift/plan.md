# Implementation Plan: Tillægsopgave uge 2: nøgletal i API og frontend samt databaseskift

**Branch**: `Kena` | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-uge2-noegletal-databaseskift/spec.md`, inkl. Clarifications, og constitution v2.0.0.

**Baggrund**: [research.md](research.md) (begrundelser), [data-model.md](data-model.md), [contracts/](contracts/) og [quickstart.md](quickstart.md).

## Summary

Alle 13 beregninger har allerede et endpoint, så API'et får ingen nye endpoints. Databasen er skiftet til PostgreSQL 18 i kode, men er ikke endeligt verificeret. Det, der mangler:

1. Grænser i kontrakten, så ugyldige værdier afvises, før de når databasen (FR-021), og en neutral fejl i stedet for status 400 i data-laget.
2. Fast rækkefølge ved lige værdier (FR-029).
3. En ny nøgletalsside i frontenden (FR-005 til FR-011).
4. Et valgfrit demo-datasæt på 150 bookinger og 900 værelsesnætter (FR-026 til FR-028).
5. Kontrolscripts og dokumentation, der stadig er skrevet til MySQL (FR-020).
6. Verificering i Converge, herunder en sammenligning med `v1-mysql`, der skal genskabes (SC-002).

## Technical Context

**Language/Version**: Node.js 26 (backend), ren HTML, CSS og JavaScript (frontend), Python 3.11 (Tableau-eksport, uændret), PowerShell 5.1 (scripts).

**Primary Dependencies**: Express 5, express-openapi-validator 5.6.2, pg 8.23.1, Nginx, Tableau Hyper API. Ingen nye afhængigheder.

**Storage**: PostgreSQL 18 (`postgres:18`). Underviserens bekræftelse afventer.

**Testing**: `node --test` mod en rigtig database (42 tests i dag) og PowerShell-scripts til kontroltal og sammenligning.

**Target Platform**: Docker Compose på Windows 11 med fem services (`db`, `backend`, `frontend`, `swagger-ui`, `tableau-export`).

**Project Type**: Webapplikation med 3-lags backend og statisk frontend.

**Performance Goals**: Nøgletal højst 2 sekunder, booking-CRUD højst 500 ms, eksport højst 30 sekunder, frontenden viser tallene inden for 5 sekunder, første opstart højst 5 minutter.

**Constraints**: API'ets svar er uændrede bortset fra FR-021 og FR-029. Presentation og business må kun ændres på grund af de to krav (FR-017). Frontenden beregner ingen nøgletal.

**Scale/Scope**: 1000 ophold, 214 værelser, 30 drikke, 13 beregninger og op til 150 demo-bookinger.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princip | Vurdering | Status før | Status efter design |
|---|---|---|---|
| I. 3-lags | `db.js` sætter en HTTP-status i data-laget. Erstattes af en neutral fejl (afsnit 3) | Afvigelse | Opfyldt |
| II. REST/JSON | Ingen ændring ud over 400-svarene | Opfyldt | Opfyldt |
| III. OpenAPI | Kontrakten mangler grænser og sorteringsregel. Skal rettes i samme commit som koden | Mangler | Opfyldt ved implementering |
| IV. Database | PostgreSQL 18 er valgt og begrundet her. Kun `backend/src/data` og `db/` kender databasen | Opfyldt | Opfyldt, afventer underviser |
| V. Docker | `docker-compose up`, healthcheck og volumen er på plads | Opfyldt | Opfyldt |
| VI. Konfiguration | `.env.example` er opdateret, og `.env` er ikke i git | Opfyldt | Opfyldt |
| VII. Frontend | Ren HTML, CSS og JavaScript uden framework | Opfyldt | Opfyldt |
| VIII. Analytics | Tallene beregnes i backenden, og Tableau er uændret | Opfyldt | Opfyldt |
| IX. Sprog | Python kun i `tableau/` som den godkendte undtagelse | Opfyldt | Opfyldt |
| X. Nøgletal via API | Frontenden mangler visningen (afsnit 4) | Mangler | Opfyldt ved implementering |
| Spec før kode | Databaseskiftet blev kodet før specifikationen. Står i spec'ens Assumptions og afklares i Converge | Afvigelse, dokumenteret | Afvigelse, dokumenteret |
| Kvalitet og test | Kontrolberegninger findes, men scriptene kører ikke mod PostgreSQL (afsnit 6) | Mangler | Opfyldt ved implementering |

Gaten er bestået. Designet tilføjer én ny afvigelse: `scripts/demodata.sql` bruger SQL uden for data-laget. Den står i Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-uge2-noegletal-databaseskift/
├── spec.md
├── plan.md                      # Denne fil
├── research.md                  # Beslutninger med begrundelser
├── data-model.md                # Data, grænser og demo-datasæt
├── quickstart.md                # Sådan valideres det hele
├── contracts/
│   ├── openapi-aendringer.md    # Ændringer i openapi/openapi.yaml
│   ├── noegletalsside.md        # Kald, tilstande og tekster i frontenden
│   └── demodata-kommando.md     # Kommandoens form og adfærd
├── checklists/requirements.md
├── converge-resultat.md         # Oprettes i Converge
└── tasks.md                     # Oprettes af /speckit-tasks
```

### Source Code (repository root)

Roden er `Hotel Kong Arthur/POC/`.

```text
backend/src/data/
├── db.js                        # Rettes: kaster neutral fejl
└── errors.js                    # Ny: InvalidValueError
backend/src/business/
├── errors.js                    # Rettes: gør InvalidValueError tilgængelig opad
└── services/                    # Rettes: metricsService og cocktailService sorterer efter FR-029
backend/src/presentation/
├── app.js                       # Rettes: fuld datokontrol
└── errors.js                    # Rettes: oversætter neutral fejl til 400
backend/tests/                   # Nye tests for FR-021 og FR-029
frontend/
├── noegletal.html               # Ny
├── noegletal.js                 # Ny
├── style.css                    # Udvides med tal, søjler og tilstande
└── index.html                   # Får et link til siden
openapi/openapi.yaml             # Grænser, sorteringsregel og nyt versionsnummer
scripts/
├── demodata.ps1, demodata.sql   # Nye
├── referencesaet.json           # Ny: kaldene til sammenligningen
├── optag-svar.ps1               # Ny
├── sammenlign-svar.ps1          # Ny
├── verificer.ps1, kontrol.sql, vis-bookinger.ps1, vis-bookinger.sql  # Rettes
README.md, docs/demo.md, docs/beslutninger.md, docs/ai-decisions.md, .gitignore  # Rettes
```

**Structure Decision**: Den eksisterende struktur fra constitutionen bruges uændret. `db/`, `tableau/` og `docker-compose.yml` skal ikke ændres, medmindre Converge finder en fejl.

## Det, der allerede er lavet

Commit `4b5e03d` har skiftet databasen. Commit `ecbc0e0` tilføjede kun specifikationen.

| Område | Status |
|---|---|
| `db/01` til `db/04` | Konverteret til PostgreSQL. Værdierne i `02_data.sql` er kontrolleret mod filen i `v1-mysql`: 1000 ophold, 5379 nætter, 11234034,00 DKK, 13448640,34 DKK |
| `docker-compose.yml`, `.env.example` | `postgres:18`, ny volumen, nyt healthcheck og port 5432 |
| `backend/src/data/` | `db.js` og alle 9 repositories er skrevet om til `pg` |
| `backend/tests/` | 5 testfiler er tilpasset, og en test for for store værdier er tilføjet |
| Presentation, business, `openapi/`, `frontend/`, `tableau/`, `scripts/`, `docs/`, `README.md` | **Uændret siden `v1-mysql`** (kontrolleret med `git diff`) |

**Ikke verificeret**: Gruppen oplyser, at skiftet er testet, men der ligger intet resultat i repoet. `specs/hotel-kong-arthur/converge-resultat.md` beskriver stadig 41 tests mod MySQL, og sammenligningen med de 3 af 58 kald er ikke gemt. Systemet er ikke startet i forbindelse med planen. Alt skal derfor bevises i Converge.

## 1. De 13 beregninger

Ingen af dem kræver et nyt endpoint. "Alle" i sidste kolonne betyder kun visningen i frontenden. Endpoints med datoer får desuden de nye datoregler (afsnit 3).

| Nr. | Beregning | Endpoint og `operationId` | Felter, der bruges | Det, der mangler |
|---|---|---|---|---|
| N1 | Gæster pr. land | `GET /api/metrics/guests/countries` (`getGuestsByCountry`) | `rows[].country`, `stays_count` | Alle. FR-029 (fem par lande er lige). Sorteringsregel i kontrakten |
| N2 | Indtjening pr. type pr. sæson | `GET /api/metrics/revenue?group_by=type_season` (`getRevenue`) | `rows[].room_type`, `season`, `revenue_dkk`, `total_dkk` | Alle. FR-029 |
| N3 | Indtjening pr. land | `GET /api/metrics/revenue?group_by=country` (`getRevenue`) | `rows[].group`, `revenue_dkk` | Alle. FR-029 |
| N4 | Type, der tjener mest | `GET /api/metrics/revenue?group_by=type` (`getRevenue`) | Første række, og rækker med samme beløb | Alle. FR-029 |
| N5 | Land, der tjener mest | Samme kald som N3 | Første række, og rækker med samme beløb | Alle |
| N6 | Årets indtjening | `GET /api/metrics/revenue/annual` (`getAnnualRevenue`) | `year`, `revenue_dkk` | Alle |
| N7 | Belægningsgrad | `GET /api/metrics/occupancy` (`getOccupancy`) | `occupancy_pct`, `occupied_room_nights` | Alle |
| N8 | Kundetilfredshed | `GET /api/metrics/satisfaction` (`getSatisfaction`) | `average_rating`, `rating_count` | Alle |
| N9 | RevPAR | `GET /api/metrics/revpar` (`getRevpar`) | `revpar_dkk`, `occupied_room_nights` | Alle |
| N10 | ADR | Samme kald som N9 | `adr_dkk` | Alle |
| N11 | Helenes samlede salg | `GET /api/cocktail/sales` (`getCocktailSales`) | `total_dkk`, `units_sold`, `year` | Alle |
| N12 | Helenes salg pr. drik | `GET /api/cocktail/sales/products` (`getCocktailProducts`) | `drink`, `category`, `revenue_dkk` | Alle. FR-029 |
| N13 | Cocktails og kaffe | `GET /api/cocktail/sales/distribution` (`getCocktailDistribution`) | `category`, `revenue_share_pct`, `unit_share_pct` | Alle. FR-029. Sorteringsregel i kontrakten |

## 2. Databasen

**Valg og begrundelse (constitution IV)**: PostgreSQL 18. Det er et selvstændigt databasesystem og ikke en udløber af MySQL, sådan som MariaDB er, og derfor blev MariaDB fravalgt. Det har eksakte decimaler, håndhæver `CHECK` og typer strengt og har et officielt Docker-image.

| Emne | Sådan er det i dag | Plan |
|---|---|---|
| **db-filer** | `01`, `02`, `03` og `04` indlæses i den rækkefølge via `/docker-entrypoint-initdb.d`, og kun når databasen er tom | Ingen ændring. MySQL-originalerne ligger kun i `v1-mysql` |
| **Volumen** | `postgres_data:/var/lib/postgresql` | Fastholdes. Fra version 18 ligger data i en undermappe pr. version, så volumen skal monteres på `/var/lib/postgresql` og ikke på den gamle `/var/lib/postgresql/data` |
| **Identity-sekvenser** | Kolonnerne er `GENERATED BY DEFAULT AS IDENTITY`. `02_data.sql` sætter sekvensen med `setval` for de 5 tabeller med faste id'er. `rooms` får id'er fra sekvensen. `bookings` og `customer_satisfaction` starter på 1 | Fastholdes. Quickstart kontrollerer, at første booking får id 1, ligesom i version 1 |
| **Decimaler** | `numeric(12,2)` og `numeric(8,2)`. `pg` leverer `numeric` som tekst, så der ikke opstår kommatal. Business regner i hele øre og giver tekst med 2 decimaler | Fastholdes |
| **Afrunding** | `drink_sales.revenue_dkk` afrundes til 2 decimaler i viewet. `AVG` afrundes til 2 decimaler i business. Procenter afrundes til 1 decimal i business | Fastholdes. Beregningerne ligger i business og er derfor ens på begge databaser |
| **Typer fra `pg`** | `db.js` beholder `DATE` og `TIMESTAMP` som tekst og gør `COUNT(*)` til et tal | Fastholdes, så `YYYY-MM-DD` og `YYYY-MM-DD HH:MM:SS` er uændrede |
| **Healthcheck** | `pg_isready` via `127.0.0.1`, fordi databasen først lytter på TCP, når `db/` er indlæst. 5 sekunders interval, 60 forsøg og `start_period` på 300 sekunder | Fastholdes. Backenden starter først, når databasen er sund. Quickstart måler SC-009 |
| **Miljøvariabler** | `DB_HOST=db`, `DB_PORT=5432`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Containeren får `POSTGRES_DB`, `POSTGRES_USER` og `POSTGRES_PASSWORD` fra dem | Fastholdes. Se risiko R-05 om brugerens rettigheder |

### Hvis underviseren afviser PostgreSQL 18

1. Frontend, kontrakt, FR-021, FR-029 og demodata fortsætter, fordi de ikke afhænger af databasen. Demodata skal dog have ét script tilpasset, og det er `demodata.sql`.
2. Gruppen får en begrundelse fra underviseren og afgør valget med `/speckit-clarify`, fordi planen ikke skal gætte på et alternativ.
3. Skiftet berører kun `db/`, `backend/src/data/`, `docker-compose.yml`, `.env.example`, kontrolscripts og tests (constitution IV).
4. Kræves en ikke-relationel database, er det et langt større arbejde. Det kræver en ny plan for data-laget, fordi repositories, views og kontrolberegninger bygger på SQL.
5. Hele verificeringen i afsnit 8 køres igen. `v1-mysql` og referencesættet ændres ikke.

**Tidspunkt**: Spørg underviseren, før Converge køres, så verificeringen ikke skal laves to gange.

## 3. Ugyldige værdier og lige værdier

### FR-021: to lag

**Beslutning**: Status 400 i `db.js` fjernes og erstattes af en neutral fejl, der oversættes til 400 i presentation. Kontrakten bliver det første lag, så værdierne normalt aldrig når databasen.

| Lag | Fil | Hvad | Dækker |
|---|---|---|---|
| 1. Kontrakt | `openapi/openapi.yaml` | `maximum` på id'er og pris og `pattern` mod nulbytes og år 0000 | Alle værdier i FR-021, uafhængigt af databasen |
| 1. Kontrakt | `backend/src/presentation/app.js` | Fuld datokontrol (`ajvFormats` med `mode: 'full'`) | 30. februar og 29. februar uden for skudår |
| 2. Sikkerhedsnet | `backend/src/data/db.js`, ny `backend/src/data/errors.js` | Kaster `InvalidValueError` ved bestemte fejlkoder fra databasen | Værdier, kontrakten ikke fanger |
| 2. Sikkerhedsnet | `backend/src/business/errors.js`, `backend/src/presentation/errors.js` | Business gør fejlen tilgængelig, og presentation svarer 400 med `VALIDATION_ERROR` | Fælles fejlformat uden databasedetaljer |

**Hvorfor status 400 skal væk**:
- En HTTP-status er præsentationens opgave, og i dag kender data-laget til den (constitution I).
- `db.js` omsætter hele fejlklasse 22 til 400. Det gør også en egen fejl, fx division med nul, til "dit input er forkert". Den neutrale fejl gælder kun `22001`, `22003`, `22007`, `22008`, `22021` og `22P02`, og alt andet giver fortsat 500.
- Kun `db.js` kender fejlkoderne, så presentation ikke kender databasen (constitution IV).

**Målt under planlægningen**: Validatoren bruger i dag `fast`, hvor `2026-02-30` og `2026-02-29` slipper igennem. `full` afviser dem begge, men også `full` godkender `0000-01-01`, så år 0000 kræver et `pattern`. Jeg har testet reglerne direkte med `ajv`, ikke gennem hele API'et, så de skal testes i det kørende system.

**Gevinst**: Afvises værdien i kontrakten, når den aldrig en `INSERT`, så sekvensen får ikke huller, og booking-id'er forbliver ens i sammenligningen med `v1-mysql`.

Se [contracts/openapi-aendringer.md](contracts/openapi-aendringer.md).

### FR-029: lige værdier

**Beslutning**: Sorteringen sker i business, hvor den allerede ligger, og ikke i SQL. Rækkefølgen afhænger dermed ikke af databasens sprogindstilling.

| Service | Primær sortering | Ved lige værdier stigende efter |
|---|---|---|
| `metricsService.getRevenue` | `revenue_dkk` faldende | `group` |
| `metricsService.getGuestsByCountry` | `stays_count` faldende | `country` |
| `cocktailService.getSalesByDrink` | `revenue_dkk` faldende | `drink` |
| `cocktailService.getDistribution` | `revenue_dkk` faldende | `category` |

Tekst sammenlignes tegn for tegn (Unicode-kodeværdi) og ikke med `localeCompare`, fordi resultatet af `localeCompare` kan afhænge af miljøets sprogdata. Navnene i data er engelske, så dansk alfabetisk rækkefølge gør ingen forskel her.

`countryRepository` sorterer stadig med `ORDER BY name` i databasen. De 20 lande har ingen tegn, hvor sprogindstillingen gør en forskel, og SC-002 kontrollerer rækkefølgen.

## 4. Frontend

Ny side `frontend/noegletal.html` med `noegletal.js`, og et link fra `index.html`. `app.js` og resten af bookingsiden røres ikke (FR-011), og Nginx skal ikke ændres. Detaljer står i [contracts/noegletalsside.md](contracts/noegletalsside.md).

| Emne | Plan |
|---|---|
| **Kald** | Kun relative kald til `/api`. Hver beregning hentes for sig, så en fejl kun rammer det ene tal. 13 kald i alt ved hver hentning |
| **Årsvalg** | "Standard" og de år, `revenue?group_by=year` giver, plus indeværende år, nyeste først |
| **Periodevalg** | "Hele året" og de 12 måneder. Det er slået fra under "Standard". Datoer dannes af valget, og det er ikke en nøgletalsberegning |
| **Opdater** | Henter alt igen og bevarer valgene, uden automatisk opdatering (FR-010). Et ældre svar må ikke overskrive et nyere, hvis ledelsen trykker flere gange |
| **Ingen data** | Tomt tal, 404, tom liste, eller `occupied_room_nights` = 0 for N7, N9 og N10. N8, når `rating_count` = 0 |
| **Kunne ikke hente tallet** | Alle andre fejl, også netværksfejl. Ingen gamle tal bliver stående |
| **Tabeller** | N1, N2, N3, N12 og N13 vises som tabeller. N4, N5, N6, N7, N8, N9, N10 og N11 som enkelte tal |
| **Søjler** | CSS-søjler i tabellerne. Bredden er værdien i forhold til listens største værdi og er kun en visuel skala, og det viste tal er altid API'ets. N13 bruger API'ets procent direkte |
| **Tal** | Dansk visning dannes ud fra API'ets tekst uden at gå gennem kommatal: `11234034.00` bliver `11.234.034,00 DKK` |
| **Demodata** | "Indeholder demodata" vises, når `GET /api/bookings` indeholder en booking med efternavnet `DEMO-DATA` |

### Forklaringen ved tallene (FR-007)

Teksten vælges ud fra `period` og `includes_history` i API'ets svar og er ikke skrevet fast.

| Tal | "Standard" | Valgt år og periode |
|---|---|---|
| N1-N5 | "Alle data: historiske ophold (2025) og nye bookinger." N1 tilføjer: "Tæller ophold, ikke personer." | "Kun nye bookinger med indtjekning i perioden. Historiske ophold har ingen datoer." |
| N6 | "Året 2025: historiske ophold og nye bookinger." | "Året [år]." For 2025 også: "Med historiske ophold." Periodevalget gælder ikke |
| N7, N9, N10 | "Indeværende år. Kun nye bookinger, fordi historiske ophold ikke har datoer." | "Den valgte periode. Kun nye bookinger." |
| N8 | "Indeværende år. Ratings på bookinger med indtjekning i perioden." | "Den valgte periode." |
| N11-N13 | "Barsalg 2025. Antagelse: alt salg regnes som Helene Christines." | Samme tekst for 2025, ellers "Ingen data". Periodevalget gælder ikke |

## 5. Demodata

**Kravet gælder hele indeværende år** (SC-013), og derfor er det årstallet, der dimensionerer datasættet.

| Periode | Tilgængelige værelsesnætter | 1,0 % kræver |
|---|---|---|
| Almindeligt år (fx 2026) | 214 × 365 = 78.110 | **782 nætter** (781,1 rundet op) |
| Skudår (fx 2028) | 214 × 366 = 78.324 | **784 nætter** (783,24 rundet op) |
| Februar, 28 dage | 5.992 | 60 nætter |
| Februar, 29 dage | 6.206 | 63 nætter |
| Måned, 30 dage | 6.420 | 65 nætter |
| Måned, 31 dage | 6.634 | 67 nætter |

**Afrundingsfælde**: API'et afrunder til 1 decimal, så allerede 743 nætter vises som 1,0 %, selvom det kun er 0,95 %. Scriptet og testen skal derfor kontrollere `occupied_room_nights` og ikke det viste tal.

**Dimensionering**: 150 bookinger på 6 nætter er 900 værelsesnætter.

| Mål | Almindeligt år | Skudår |
|---|---|---|
| Belægning for året | 1,152 % (vises som 1,2 %) | 1,149 % (vises som 1,1 %) |
| Laveste og højeste måned | 1,04 % og 1,18 % | 1,04 % og 1,18 % |
| Bookinger, der kan springes over, før kravet ikke er opfyldt | 19 | 19 |
| Omsætning | 1.817.100,00 DKK | 1.817.100,00 DKK |
| RevPAR | 23,26 DKK | 23,20 DKK |
| ADR | 2.019,00 DKK | 2.019,00 DKK |
| Kundetilfredshed | 4,00 | 4,00 |

Tallene er beregnet med en simulering af reglerne herunder for 2026, 2027 og 2028.

### Sådan dannes rækkerne

For hver række i = 0 til 149 og D = antal dage i året:

| Felt | Regel |
|---|---|
| Værelse | Det (i+1). værelse efter `room_number`, uden testværelser. 150 forskellige værelser, så demo-bookingerne ikke kan overlappe hinanden |
| Indtjekning | 1. januar + ⌊i × (D − 7) / 149⌋ dage. Bookingerne fordeles jævnt over året, og sidste udtjekning er 31. december, så alle nætter ligger i året |
| Udtjekning | Indtjekning + 6 dage |
| Pris | 6 × (1.500 + (i mod 8) × 150) DKK |
| Gæster | 1, som alle værelser har plads til |
| Land | Skiftevis de 20 lande |
| Navn | `Demo` og `DEMO-DATA` |
| Rating | 3 + (i mod 3), kommentar `Demodata` |

### Kommando

Detaljer i [contracts/demodata-kommando.md](contracts/demodata-kommando.md).

```text
powershell -ExecutionPolicy Bypass -File scripts\demodata.ps1 -Indlaes
powershell -ExecutionPolicy Bypass -File scripts\demodata.ps1 -Fjern
```

**SQL og REST API'et**: Gruppen vil generere rækkerne med SQL, og FR-027 kræver, at de oprettes gennem REST API'et. Begge dele kan opfyldes: `scripts/demodata.sql` er kun en `SELECT` med `generate_series`, der skriver rækkerne som JSON, og `demodata.ps1` sender dem til `POST /api/bookings` og `POST /api/bookings/{id}/satisfaction`. Ingen rækker indsættes direkte, så bookingreglerne gælder. Skal de indsættes direkte med `INSERT`, skal FR-027 ændres først.

**Indlæsning**:
1. Stopper, hvis `GET /api/metrics/revenue/annual` viser, at `HISTORIK_AAR` er indeværende år.
2. Stopper, hvis der allerede findes bookinger med efternavnet `DEMO-DATA`.
3. Danner rækkerne med SQL og opretter dem gennem API'et. Et 409-svar betyder, at en eksisterende booking fylder værelset. Rækken springes over og tælles med i resultatet.
4. Kontrollerer til sidst `occupied_room_nights` for hele året mod kravet og melder fejl, hvis det ikke er nået.

**Fjernelse**: Henter `GET /api/bookings`, finder efternavnet `DEMO-DATA` og sletter dem med `DELETE`. Ratings slettes med bookingen. Findes der ingen, sker der ingenting.

**Kontroltal**: Rækkerne ligger i indeværende år og ikke i `HISTORIK_AAR`, så 1000 ophold, 5379 nætter, 11234034,00 DKK for 2025 og alle bartal er uændrede. Under "Standard" stiger totalen i N2 og N3 til 13.051.134,00 DKK, så længe datasættet er indlæst, sådan som spec'en forudser.

## 6. Kontrolscripts og dokumentation

Ingen af filerne ændres af denne plan. Ændringerne laves under implementeringen.

| Fil | Problem | Ændring |
|---|---|---|
| `scripts/verificer.ps1` | Linje 22 kalder `mysql`, som ikke findes i `postgres:18`, og linje 39 nævner MySQL | Kald `psql` med `POSTGRES_USER` og `POSTGRES_DB`. Tilføj procentandelene fra API'et |
| `scripts/kontrol.sql` | `HEX()` findes ikke i PostgreSQL | Brug `encode(convert_to(...), 'hex')`, og sammenlign med `4DC3BC6C6C6572` uden hensyn til store og små bogstaver |
| `scripts/vis-bookinger.ps1`, `vis-bookinger.sql` | Kalder `mysql`, og kommentarerne nævner MySQL | Kald `psql`, og ret kommentarerne |
| `scripts/kontroltal.ps1`, `eksport-nu.ps1` | Taler kun med API'et og Tableau | Ingen ændring |
| `README.md` | Linje 18, 26, 61 og 68: MySQL 8, `mysql_data` og kun `db/01` til `03` | Ret, og tilføj nøgletalssiden og demodata |
| `docs/demo.md` | Overskrift og trin 3 nævner MySQL | Ret, og tilføj forløbet med nøgletalssiden og demodata |
| `docs/beslutninger.md` | B-11, B-15, B-25 m.fl. beskriver MySQL | Historikken bevares. Nye beslutninger tilføjes fra B-55 |
| `docs/ai-decisions.md` | Linje 8 nævner `mysql2` | Historikken bevares. Tilføj en ny række om `pg` |
| `.gitignore` | `mysql_data/` | Fjernes |
| `backend/tests/security-performance.test.js` | Linje 54 leder kun efter `sql`, `mysql` og `ER_` | Lad testen også lede efter `postgres` og `pg_` |
| `specs/hotel-kong-arthur/` | Beskriver MySQL | Ændres ikke, fordi den er version 1 |

## 7. Tableau-eksporten

`tableau/` er uændret siden `v1-mysql` og skal forblive sådan. Eksporten henter kun fra REST API'et, så den mærker ikke databasen (constitution IX).

| Ændring | Virkning på eksporten |
|---|---|
| Databaseskift | Ingen, så længe SC-002 holder |
| Grænser i kontrakten | Ingen, fordi eksporten kun sender gyldige værdier |
| FR-029 | Rækkernes indbyrdes rækkefølge i `guests_by_country` kan ændre sig. Værdierne er ens, så sammenligningen sker uden hensyn til rækkefølge |
| Demodata | Demo-bookinger kommer med, så længe de er indlæst. Sammenligningen køres derfor uden demodata |

Verificering: de 16 tabeller læses ud af `.hyper`-filen fra både `v1-mysql` og det nye system i `tableau-export`-containeren og sammenlignes.

## 8. Tests og verificering i Converge

Resultatet skrives i `specs/001-uge2-noegletal-databaseskift/converge-resultat.md`. Se [quickstart.md](quickstart.md).

| Krav | Sådan kontrolleres det |
|---|---|
| SC-001, SC-003 | `verificer.ps1` med `kontrol.sql` og API'et, fra ren opstart og uden demodata |
| SC-002, FR-015 | Sammenligningen herunder |
| SC-004, SC-008 | `contract.test.js` i begge retninger og gennemgang af de 13 beregninger i Swagger UI |
| SC-005, SC-006 | Manuel gennemgang af siden med browserens netværkslog, tid målt med netværksloggen |
| SC-007, FR-021 til FR-023 | Ny `invalid-values.test.js`: hver værdi på hvert endpoint, status, fejlformat, ingen `500` og samme antal rækker bagefter |
| FR-029 | Ny `tie-order.test.js`: lige værdier fra rigtige data (N1) og fra testbookinger |
| SC-009 | Tid fra ren opstart med `docker-compose up` til alle services er sunde |
| SC-010 | Sammenligning af de 16 tabeller (afsnit 7) og tiden for en eksport |
| SC-011 | Eksisterende `security-performance.test.js` |
| SC-013, FR-026 til FR-028 | Kør `-Indlaes`, kontrollér tallene, kør `-Fjern`, og kontrollér, at alle 13 er tilbage ved udgangspunktet |
| FR-017 | Tjekket herunder |

### Sammenligningen med `v1-mysql`, der skal genskabes (SC-002)

Den oprindelige sammenligning med 3 af 58 afvigende kald ligger ikke i repoet. Antallet af kald i det nye referencesæt kan derfor afvige fra 58, og det står i Converge-resultatet.

1. **Referencesæt**: `scripts/referencesaet.json` indeholder alle GET-endpoints med faste parametre, en fast rækkefølge af bookinger og ratings med datoer i fremtiden og de eksisterende fejlsvar.
2. **Version 1**: Tjek `v1-mysql` ud i en midlertidig mappe med `git worktree`, start den med sit eget projektnavn (`docker-compose -p hka-v1`), og optag svarene med `optag-svar.ps1`. Stop den igen.
3. **Nyt system**: Start fra ren opstart uden demodata, og optag de samme svar. Alle GET-kald køres **10 gange**, og de 10 svar skal være ens.
4. **Sammenligning**: `sammenlign-svar.ps1` ser bort fra `created_at` og `updated_at`. Rækker med samme sorteringsværdi i svarene fra version 1 sorteres først efter FR-029.
5. **Resultat**: 100 % ens. Kald med værdier fra FR-021 holdes uden for sammenligningen og står i testen i stedet.

De to systemer kører efter hinanden, fordi de bruger samme porte. Projektnavnet er nødvendigt, fordi begge mapper hedder `POC`, og `down -v` ellers kan ramme den forkerte volumen.

### Tjek af presentation og business (FR-017)

Kør `git diff v1-mysql -- backend/src/presentation backend/src/business`. Hver ændring skal i Converge-resultatet kobles til FR-021 eller FR-029.

| Forventet fil | Krav |
|---|---|
| `presentation/app.js`, `presentation/errors.js`, `business/errors.js` | FR-021 |
| `business/services/metricsService.js`, `business/services/cocktailService.js` | FR-029 |

Enhver anden ændring er en fejl, der skal forklares eller fjernes. Mappen `openapi/` tjekkes for sig (FR-025).

## 9. Beslutninger og risici

### Beslutninger

Begrundelser og fravalg står i [research.md](research.md).

| Nr. | Beslutning | Krav |
|---|---|---|
| D-01 | PostgreSQL 18, underviserens bekræftelse afventer | FR-012 |
| D-02 | Fejlen i `db.js` erstattes af neutral `InvalidValueError`, der oversættes til 400 i presentation | FR-021, FR-017 |
| D-03 | Kontrakten er første lag mod ugyldige værdier, med fuld datokontrol og `pattern` | FR-021, FR-025 |
| D-04 | Kun 6 bestemte fejlkoder fra databasen giver 400 | FR-023 |
| D-05 | Lige værdier sorteres i business, tegn for tegn | FR-029 |
| D-06 | Nøgletallene får deres egen side, og `app.js` røres ikke | FR-005, FR-011 |
| D-07 | Hver beregning hentes for sig, så fejl ikke spreder sig | FR-008 |
| D-08 | Forklaringen vælges ud fra API'ets felter | FR-007 |
| D-09 | Demodata: 150 bookinger, 6 nætter, 900 værelsesnætter | SC-013 |
| D-10 | SQL danner rækkerne med en `SELECT`, og REST API'et opretter dem | FR-027 |
| D-11 | Mærkningen er efternavnet `DEMO-DATA` | FR-027 |
| D-12 | Sammenligningen køres med PowerShell og `git worktree`, og systemerne kører efter hinanden | SC-002 |
| D-13 | Gammel historik i `docs/` bevares, og nye beslutninger tilføjes | FR-020 |

### Risici

| Nr. | Risiko | Konsekvens | Håndtering |
|---|---|---|---|
| R-01 | Underviseren afviser PostgreSQL 18 | Datadelen skal laves om | Spørg før Converge. Isoleringen begrænser ændringen (afsnit 2) |
| R-02 | Sammenligningen viser andre forskelle end rækkefølge | FR-015 er ikke opfyldt | Ret i data-laget. Forskelle må ikke forklares væk |
| R-03 | Databaseskiftet er aldrig blevet verificeret samlet | Fejl dukker op sent | Kør `verificer.ps1` tidligt, så snart scriptene er rettet |
| R-04 | En rigtig gæst hedder `DEMO-DATA`, eller demoen fjernes ved en fejl | Rigtig booking slettes | Navnet er bevidst usandsynligt, og `-Fjern` skriver, hvor mange der slettes |
| R-05 | `POSTGRES_USER` er superbruger, så `hotel_app` får flere rettigheder end i version 1 (B-12) | Afviger fra mindst mulige rettigheder | Dokumenteres som kendt begrænsning. En egen bruger kræver et nyt init-script og er ikke et krav her |
| R-06 | Demo-bookinger giver 409 i demoen | En live-booking fejler | Vælg et værelse uden demo-booking. Står i `docs/demo.md` |
| R-07 | Demo glemmes indlæst under kontrol | Forkerte totaler | `verificer.ps1` starter med `down -v`, så demodata er væk. `optag-svar.ps1` stopper, hvis der findes `DEMO-DATA` |
| R-08 | `postgres:18` er et flydende tag | En ny mindre version kan ændre noget | Lav risiko. Den brugte version noteres i Converge-resultatet |
| R-09 | Browserens ur afgør "indeværende år" | Kan afvige fra serverens ur omkring nytår | Accepteres. Tableau-eksporten bruger også systemets dato |
| R-10 | Datoreglerne er kun testet med `ajv` alene | Middleware kan opføre sig anderledes | `invalid-values.test.js` kører gennem hele API'et |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `scripts/demodata.sql` bruger SQL uden for data-laget, og det er ikke en kontrolberegning (constitution I og IV) | Gruppen har bedt om, at rækkerne genereres med SQL. Den er kun en `SELECT`, skriver ingen data og er ikke en del af backenden | En løkke i `demodata.ps1`, der læser værelser og lande fra API'et, ville undgå afvigelsen. Den er fravalgt, fordi gruppen valgte SQL. Direkte `INSERT` er fravalgt, fordi det strider mod FR-027 |
