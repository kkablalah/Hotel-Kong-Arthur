# Implementeringsplan: Hotel Kong Arthur dataanalyse-platform

**Branch**: main | **Dato**: 2026-10-29 | **Spec**: spec.md (inkl. Clarifications, FR-01-14, US-01-16) | **Constitution**: v1.0.0

**Ændringslog**:
- 2026-10-27: Tableau-integration opdateret fra Web Data Connector (deprecated) til Hyper Extract via script
- 2026-10-29 (analyse): Reservemetode (direkte MySQL) fjernet; Swagger UI i egen container; belægnings-eksempel rettet til BR-01; db/-mappe mountes som helhed (01/02/03-filer)
- 2026-10-29 (teknologiskift): Backend skiftet fra Python/FastAPI til **Node.js + Express**; SQLAlchemy erstattet af **mysql2 med rå SQL**; kontrakt-tilgangen ændret til **contract-first**; Tableau-script er et **eksternt Python-værktøj** (begrundet undtagelse, se afsnit 3 og 10); direkte MySQL-forbindelse fra Tableau genindført som dokumenteret reservemetode/afvigelse (se afsnit 3.4 og 10)
- 2026-10-29 (godkendte beslutninger): Live = synligt i næste GET uden caching; eksportinterval 60 sekunder (`EXPORT_INTERVAL_SECONDS=60`). `guest_count` (1..værelseskapacitet, kapacitet 1-4 fra data). db/-filer produceres som **MySQL Workbench-eksport** (01_schema.sql/02_data.sql) + `db/03_extensions.sql`. Beløb: DECIMAL, DKK med 2 decimaler; procenter 1 decimal; kontroltolerance 0,01 DKK / 0,1 procentpoint med ROUND. Nye NFR'er: ydeevne (2 s / 500 ms / 30 s) og sikkerhed (parametriserede queries, ingen stack traces, ingen login — bevidst svaghed). Belægning: occupied nights / (214 × nætter), [check_in, check_out). Fordeling: **begge** andele (omsætning hovedtal + enheder). Selvvalgt nøgletal: **RevPAR + ADR** (BR-09). Årstal: `?aar=` med standard seneste komplette år. Datoer ISO 8601; gæster uden land = "Ukendt"; dobbeltbooking-definition (BR-10); Python-undtagelsen skrevet ind i constitution princip IX
- 2026-11-01 (gruppens svar): Værelser fordeles efter ophold pr. type og ligger i `db/04_rooms_seed.sql` (antagelse). Kapacitet er hotellets maksimum pr. type, højst 4. `HISTORIK_AAR` (standard 2025) er året for de historiske ophold. Alt barsalg regnes som Helenes (antagelse). Datamodellen følger nu de leverede `db/`-filer. Ratings indtastes pr. booking i frontenden (`POST /api/bookings/{id}/satisfaction`), og barsalget hører også til `HISTORIK_AAR`.
- 2026-11-01 (converge): `tableau-export` starter nu med `docker-compose up`, og profilen `extract` er fjernet, fordi constitution V og opgaven kræver én kommando (T064, T066).

Denne plan beskriver **hvordan** systemet bygges, ikke **hvad** det skal kunne (se spec.md).

---

## Summary

Systemet er en dataanalyse-platform for Hotel Kong Arthur, der analyserer og præsenterer hoteldrift-data (belægningsgrad, indtjening, gæsternes lande, kundetilfredshed, cocktailbarens salg) for beslutningstagere. Systemet består af fire dele:

1. **Backend** i Node.js med Express og tre-lags arkitektur (presentation → business → data), der eksponerer et REST/JSON-API og beregner alle nøgletal.
2. **Frontend** i ren HTML/CSS/JavaScript uden framework, serveret af Nginx, som også sender `/api` videre til backenden (samme origin → ingen CORS).
3. **Database** i MySQL 8 med schema og startdata i `db/`, der indlæses automatisk ved første opstart.
4. **Tableau-eksport** som et lille, separat Python-script i egen container — et eksternt værktøj, der henter data fra backendens REST API og skriver en `.hyper`-fil til en mappe på værtsmaskinen, som Tableau Desktop åbner.

---

## 1. Teknologivalg

### Backend: Node.js (aktuel LTS) + Express

**Valgt:** Node.js (aktuel LTS-version, skriv den konkrete version i `backend/package.json` og `.nvmrc` når projektet sættes op) med **Express** som letvægts webframework.

**Begrundelse (Express frem for Fastify):**
- Gruppen skal kunne forklare al koden (constitution "Ejerskab og AI"). Express er det mest udbredte og mest dokumenterede Node-framework: flest tutorials, mest genkendeligt for nye læsere, færrest "magiske" abstraktioner.
- Express er minimalt: routing + middleware og ikke mere — det gør lagene tydelige og gør det nemt at placere al logik i business-laget.
- Fastify er hurtigere og har indbygget schema-validering, men kræver kendskab til Fastify-specifikke konventioner (plugins, JSON-schema-registration), som ikke alle i gruppen kan forklare på forhånd.

> **Gruppebeslutning påkrævet:** Express anbefales, men Express vs. Fastify skal endeligt godkendes af gruppen (constitution "Ejerskab og AI").

**Sprogbegrundelse (constitution princip IX):** Node.js/JavaScript er ét sprog og ét framework for hele backenden, kan levere en OpenAPI-specifikation (via contract-first, se afsnit 2) og kører naturligt i Docker. Bemærk: ét andet sprog findes i projektet — det eksterne Tableau-script (Python), se afsnit 3 og 10.

### Database: MySQL 8 med mysql2-driveren

- Driver: **mysql2** (preparedStatement-pool, promises-understøttelse, aktivt vedligeholdt).
- **Rå, parametriseret SQL i repositories** i data-laget (constitution princip I: SQL kun i data-laget). Alle forespørgsler bruger prepared statements/parametre — ingen streng-sammensat SQL.
- Connection-håndtering: én delt pool i data-laget, konfigureret via miljøvariabler (constitution princip VI).

**Vurdering: Query builder (Knex)?** **Fravalgt som anbefaling.**
- Knex giver parameter-flugt og læsbare query-buildere, men tilføjer en abstraktion gruppen skal kunne forklare, og for et 2-ugers projekt med få, faste forespørgsler er rå SQL med mysql2 enklere og mere gennemsigtig i review.
- Knex' migrations-værktøj har vi ikke brug for: schema og startdata leveres som SQL-filer i `db/` (constitution princip IV).
- Kriteriet for at genoverveje: hvis antallet af dynamiske filtre/i filtre bliver stort, kan Knex genovervejes. **Gruppebeslutning påkrævet**, om Knex skal med alligevel.

### Frontend: Ren HTML/CSS/JavaScript bag Nginx

- Ingen framework (constitution princip VII). Frontenden kan oprette, rette og slette bookinger via backendens API.
- Nginx i egen Docker-container serverer de statiske filer og **proxy'er `/api` til backenden** (`proxy_pass` til `http://backend:8000` via servicenavn).
- **Konsekvens: CORS undgås** — frontend og API har samme origin fra browserens synspunkt, så `Access-Control-Allow-Origin`-håndtering er ikke nødvigig for frontendens skyld. Bemærk: API'et er stadig direkte tilgængeligt for eksterne konsumenter (fx hotellets eksisterende bookingsystem, constitution VII), som ikke berøres af proxien.

### Tableau: Eksternt Python-script (Hyper API)

Hyper API findes kun til Python, Java og C++ — ikke til Node.js. Tableau-eksporten er derfor et lille, separat Python-script i en egen container. Det er et **eksternt værktøj, ikke en del af backenden**, og en begrundet undtagelse fra princip IX om ét backend-sprog (se afsnit 3 og 10).

---

## 2. API-kontrakt (contract-first)

**Problem:** Node/Express genererer ikke OpenAPI automatisk (som FastAPI gjorde). Kontrakten skal derfor håndteres aktivt.

**Valgt: Contract-first** — `openapi/openapi.yaml` skrives og vedligeholdes som kilde-sandhed **før** endpointene implementeres, og implementeringen valideres **mod** kontrakten med **express-openapi-validator** (monteres som middleware: afviser requests og responses, der ikke stemmer med specifikationen).

**Begrundelse:**
- Constitution princip III kræver, at "OpenAPI-specifikationen og implementeringen skal altid stemme overens". Contract-first gør kontrakten til et levende artefakt, der fanger drift allerede ved kørsel/test — ikke en dokumentation, der skrives bagefter og forældes stille.
- Alternativet, kodegenereret kontrakt (swagger-jsdoc: JSDoc-kommentarer → spec; eller Fastify + fastify-swagger: JSON-schemas → spec), er sand nok på papiret, men i praksis glider JSDoc-kommentarer fra koden, og fejl opdages først, når nogen læser den genererede fil. Det er netop den "ude af sync"-risiko, constitution III vil undgå.
- Contract-first passer desuden til opgavens krav om en OpenAPI-specifikation, der skal kunne vises i Swagger UI og bruges af Tableau-scriptet som tjek på endpoint-listen.

**Sådan holdes kontrakt og implementering i sync:**
1. **Samme-commit-reglen** (constitution III): enhver API-ændring opdaterer `openapi/openapi.yaml` i samme commit.
2. **Runtime-validering:** express-openapi-validator er slået til (i hvert fald i test; i produktion kan den køre i warn-mode).
3. **Kontrakttest** (se afsnit 8): en automatiseret test går kontrakten igennem og verificerer, at hvert dokumenteret endpoint findes i Express-appen — og at hver registreret route er dokumenteret.
4. `openapi/openapi.yaml` ligger i git og er den fil, Swagger UI-containeren viser.

**Swagger UI i egen container** (constitution princip III og opgavens krav): `swaggerapi/swagger-ui`-container på egen port (fx 8080), der serverer `openapi/openapi.yaml` fra det mounted `openapi/`-katalog. Et selvstændigt værktøj (fx Schemathesis) kan senere bruges til kontrakt-test, men er ikke påkrævet.

> Bemærk: Express' eget `/docs`-modul findes ikke — Swagger UI findes udelukkende i den egen container.

---

## 3. Tableau-integration: Hyper Extract via eksternt Python-script

### 3.1 Løsning

Hyper Extract er valgt frem for Web Data Connector (WDC), som Tableau har afskrevet. Fordi Hyper API ikke findes til Node.js, implementeres eksporten som et **eksternt værktøj**:

- **Komponent:** et lille Python-script i en egen Docker-container (servicenavn: `tableau-export`), adskilt fra backenden (egen mappe `tableau/`, eget image).
- **Datakilde:** scriptet kalder **kun** backendens REST API (endpoints, se afsnit 6) — det tilgår aldrig databasen direkte (constitution princip VIII: dashboardet henter data via backendens REST API; nøgletal er beregnet i backenden, ikke i Tableau).
- **Output:** scriptet skriver en `.hyper`-fil (fx `extracts/tableau_data.hyper`) til en mappe, der er **monteret på værtsmaskinen**, så Tableau Desktop kan åbne filen direkte.
- **Skriver sikkert:** ny fil skrives som midlertidig fil og atomisk omdøbning, så Tableau aldrig ser en halvskrevet fil.
- **Gentagelse:** scriptet starter med `docker-compose up` og kører med fast interval via miljøvariablen `EXPORT_INTERVAL_SECONDS=60` (hvert 60. sekund). Det kan også køres én gang med `docker-compose run --rm tableau-export python hyper_extract.py --once`. Intervallet er besluttet (spec C-14/AC-05.4) og dokumenteres i README.
- **Tableau Desktop:** åbner `.hyper`-filen som datakilde og bygger dashboardet oven på de **færdigberegnede** nøgletal.

### 3.2 Begrundet undtagelse fra ét backend-sprog (constitution princip IX)

Constitution princip IX siger: "Ét sprog og framework skal bruges til **hele backenden**." Python-scriptet er ikke en del af backenden, men princippet skal alligevel håndteres eksplicit:

- **Undtagelsen:** projektet bruger JavaScript/Node.js til hele backenden og Python udelukkende til dette ene, isolerede eksportværktøj.
- **Begrundelse:** Hyper API findes ikke til Node.js; alternativerne (Java/C++) er sværere for gruppen. Scriptet er lille, har ingen forretningslogik (kun HTTP-hentning + filskrivning) og berører ikke backendens lag.
- **Gruppebeslutning påkrævet:** undtagelsen skal godkendes og noteres af gruppen (constitution "Governance": ændringer dokumenteres og godkendes af hele gruppen). Uden godkendelse: vælg Java/C++-script eller CSV-eksport i stedet.

### 3.3 Begrænsning i forhold til live-data

Fra Clarifications (C-01) er "live" defineret som: en ændring via POST/PUT/DELETE er **synlig i næste GET-kald uden caching** — backenden er således live. **Dashboardet er det kun med forsinkelse:**

- Data i `.hyper`-filen er kun aktuel på ekstraktionstidspunktet; minimumsforsinkelse = eksportintervallet (60 sekunder, `EXPORT_INTERVAL_SECONDS=60`) + manuel genindlæsning i Tableau.
- Ingen streaming eller real-time opdatering; Tableau Desktop skal genindlæse datakilden efter ny ekstraktion.
- Disse begrænsninger dokumenteres i README, så de ikke fremstilles som real-time (spec afsnit 6.3: demonstrationsdata skal kunne skilles fra historiske).

### 3.4 Reservemetode: Direkte MySQL-forbindelse fra Tableau (dokumenteret afvigelse)

Hvis Hyper Extract-scriptet fejler umiddelbart før aflevering, findes én reservemetode: Tableau Desktop kan forbinde direkte til MySQL (via JDBC-driver) med server, database og credentials fra `.env`.

Denne metode er en **dokumenteret afvigelse** fra opgavens arkitekturkrav og en **konflikt med constitution princip VIII** (dashboardet skal hente data via backendens REST API) og princip I (SQL-logik omgås). Derfor:

- **Gruppebeslutning påkrævet** før metoden tages i brug, og brugen noteres i Converge-resultatet.
- **Kun til test/backup**, aldrig i produktion.
- **Sikkerhedsrisiko:** MySQL-credentials skal deles med Tableau-brugeren — brug en read-only-bruger, hvis metoden anvendes.
- Konsekvensen af blot at lade reservemetoden stå som "mulighed" uden godkendelse er netop, at princip VIII udhules — derfor skal den stå her som afvigelse med disse betingelser og aldrig uden markering.

---

## 4. Arkitektur (3-lags, Node.js)

```
backend/
├── src/
│   ├── presentation/   # Express-app, routes og controllere
│   │   ├── app.js          # App-opsætning, middleware, openapi-validator
│   │   ├── routes/         # Én fil pr. ressource (bookings, metrics, cocktail)
│   │   ├── controllers/    # Request→service→response-glue
│   │   └── errors.js       # Fælles fejlformat og fejlhåndtering
│   ├── business/        # Forretningslogik
│   │   ├── services/       # booking_service, metrics_service, cocktail_service, ...
│   │   └── validators/     # Forretningsvalidering (fx booking-regler)
│   └── data/            # Dataadgang
│       ├── db.js           # mysql2-pool, læser miljøvariabler
│       └── repositories/   # booking_repository, room_repository, metrics-repositories, ...
└── tests/
```

### Præsentationslag (`presentation/`)

**Ansvar:** modtage HTTP-forespørgsler, parse/serialisere JSON, sætte korrekte statuskoder, kalde services.

- **Må kende til:** Express (req/res, routing, middleware), business-lagets services (via dependency injection/konstruktør), OpenAPI-kontrakten (montages af validator-middlewaren).
- **Må IKKE kende til:** SQL, mysql2, database-modeller eller forretningsregler. Ingen beregninger eller valideringsregler her — kun HTTP-glue.

### Forretningslogiklag (`business/`)

**Ansvar:**
- **Validering af forretningsregler:** påkrævede felter, `check_in_date < check_out_date`, `total_price > 0`, at værelse og gæst findes.
- **Bookingregler:** dobbeltbooking-tjek efter BR-10 (overlap hvis `ny.check_in < eksisterende.check_out` AND `ny.check_out > eksisterende.check_in` → afvis med 409; udtjekning og ny indtjekning samme dag er tilladt; minimum én nat) — reglen bor her, selve opslaget efter overlappende bookinger sker via repository. Desuden kapacitetsreglen: `1 <= guest_count <= rooms.capacity` (kapacitet 1-4 fra data), ellers 400 med fejlbesked (FR-01).
- **Nøgletalsberegninger:** belægningsgrad (BR-01), omsætning pr. type/sæson/land/år (BR-02, BR-03), årlig omsætning, gæster pr. land, kundetilfredshed (BR-08), cocktail-nøgletal (BR-06, BR-07), sæsonklassifikation (BR-03).
- **Må kende til:** data-lagets repositories (via interfaces/metoder), forretningsregler og domænemodel.
- **Må IKKE kende til:** Express, HTTP, statuskoder, JSON-format, mysql2 eller SQL-tekst.

### Dataadgangslag (`data/`)

**Ansvar:** al kommunikation med MySQL — rå, parametriseret SQL, pool-håndtering, transaktioner, aggregerede forespørgsler til nøgletal (grupperinger foretages i SQL, resultatet tolkes og beregnes færdigt i business-laget).

- **Må kende til:** mysql2, SQL, database-skemaet.
- **Må IKKE kenne til:** Express, HTTP eller forretningsregler (ingen `if`-forretningslogik her).

**Konstitutions-tjek (princip I):** SQL-tekst findes udelukkende i `data/repositories/`; nøgletalslogik findes udelukkende i `business/services/` — ingen af delene i controllere eller SQL-views.

---

## 5. Datamodel

**Status:** `db/01_schema.sql` og `db/02_data.sql` er leveret fra MySQL Workbench og må ikke ændres. `db/03_extensions.sql` tilføjer `rooms`, `bookings` og `customer_satisfaction`, og `db/04_rooms_seed.sql` indsætter de 214 værelser.

### Tabeller

| Tabel | Nøglefelter | Bemærkning |
|-------|-------------|------------|
| `room_types` | room_type_id, name | 8 typer med engelske navne (leveret) |
| `countries` | country_id, name | 20 lande med fulde navne (leveret) |
| `stays` | stay_id, first_name, family_name, country_id, room_type_id, days_rented, season, price | 1000 historiske ophold uden datoer (leveret). Hører til året `HISTORIK_AAR` (BR-04) |
| `rooms` | room_id, room_number, room_type_id (FK), capacity, is_active | 214 værelser fra `db/04_rooms_seed.sql` (antagelse). `capacity` er hotellets maksimum pr. type, højst 4. `room_number` er et løbenummer |
| `bookings` | booking_id, room_id (FK), first_name, family_name, country_id (FK, kan være tom), guest_count, check_in_date, check_out_date, total_price, created_at, updated_at | `guest_count`: 1 <= guest_count <= rooms.capacity (FR-01); `total_price` = total booking-værdi inkl. skatter/gebyrer (BR-02), DECIMAL, DKK med 2 decimaler; uden land vises som "Ukendt" og tæller med i totaler |
| `drink_categories` | category_id, name | Cocktail og Coffee (leveret) |
| `drinks` | drink_id, name, category_id (FK), price_dkk, units_sold | 20 cocktails + 10 kaffe (leveret). Hverken år eller medarbejder, så alt salg regnes som Helene Christines og hører til `HISTORIK_AAR` (BR-06) |
| `customer_satisfaction` | satisfaction_id, booking_id (FK), rating (1-5), comment, created_at | FR-14, US-16, BR-08. Tom ved start. Ratings indtastes pr. booking |

### Tabeller, som spec kræver — status

- **Kundetilfredshed (FR-14/US-16/BR-08):** Krævet af spec; `customer_satisfaction` oprettes i `db/03_extensions.sql`. Leverede data indeholder ingen ratings, så de indtastes pr. booking.
- **Cocktailsalg (FR-07-09/BR-06/BR-07):** Bygger på `drinks`. Der findes ingen transaktioner, så salget hører samlet til `HISTORIK_AAR` (BR-06).
- **Ingen nye tabeller opfundet i denne plan.** Skulle det leverede datarepository vise sig at have et andet schema (fx booking-værdi splittet i skat/gebyer), registreres det som en **ændring med begrundelse** her og i `db/01_schema.sql` — ikke tavst.

### Relationer

- `bookings` → `rooms` (1:N), `rooms` → `room_types` (1:N), `bookings` → `countries` (1:N), `stays` → `room_types` og `countries` (1:N)
- `drinks` → `drink_categories` (1:N)
- `customer_satisfaction` → `bookings` (1:N)

### Sæsoner

Sæsonklassifikation (BR-03: High: 1. jun-31. aug + 20. dec-5. jan; Mid: 1. apr-31. maj + 1. sep-31. okt; Low: 6. jan-31. mar + 1. nov-19. dec) er **beregning i business-laget** (`business/season.js` i tasks), ikke en tabel — ingen dækningsårsag til at opbevare sæsoner i databasen, når afgrænsningerne er dokumenterede regler.

---

## 6. API-design

### Ressourcer og endpoints

Ressourcer navngives med substantiver (constitution princip II). Endpoint-navnene er engelske. Skelettets endpoint gennem alle tre lag er `GET /api/room-types`, og `GET /api/rooms` og `GET /api/countries` bruges af bookingformularen.

#### Booking-CRUD (FR-01, US-01-04)

| Endpoint | HTTP | Beskrivelse | Statuskoder |
|----------|------|-------------|-------------|
| `/api/bookings` | GET | Liste bookinger (filtrering på dato/værelse) | 200, 400 |
| `/api/bookings` | POST | Opret booking | 201, 400, 409 (dobbeltbooking) |
| `/api/bookings/{id}` | GET | Hent booking | 200, 404 |
| `/api/bookings/{id}` | PUT | Opdater booking | 200, 400, 404, 409 |
| `/api/bookings/{id}` | DELETE | Slet booking | 204, 404 |
| `/api/bookings/{id}/satisfaction` | POST | Giv en rating fra 1 til 5 (BR-08) | 201, 400, 404 |

#### Nøgletal (FR-03-06, FR-14, US-06-09, US-16)

| Endpoint | HTTP | Parametre | Statuskoder |
|----------|------|-----------|-------------|
| `/api/metrics/occupancy` | GET | `start_date`, `end_date` | 200, 400 |
| `/api/metrics/revenue` | GET | `group_by` (type/season/country/year/type_season), `start_date`, `end_date` (valgfri, kun bookinger med periode) | 200, 400 |
| `/api/metrics/revenue/annual` | GET | `aar` (valgfri; standard = `HISTORIK_AAR`, BR-04) | 200, 400, 404 |
| `/api/metrics/revenue/running` | GET | Ingen. Løbende indtjening fra nye bookinger | 200 |
| `/api/metrics/revpar` | GET | `start_date`, `end_date`. RevPAR og ADR (BR-09) | 200, 400 |
| `/api/metrics/guests/countries` | GET | `start_date`, `end_date` (valgfri, kun bookinger med periode) | 200, 400 |
| `/api/metrics/satisfaction` | GET | `start_date`, `end_date` | 200, 400 |

**Fælles API-konventioner:** Alle datoparametre er ISO 8601 (`YYYY-MM-DD`, OpenAPI-format `date`). Beløb returneres i DKK med 2 decimaler (DECIMAL i databasen); procenter med 1 decimal (BR-02). Gæster uden land vises som kategorien "Ukendt" og tæller med i totaler (AC-08.4). Ydeevne: nøgletals-endpoints svarer inden for 2 sekunder, booking-CRUD inden for 500 ms (NFR-09); `.hyper`-eksporten tager under 30 sekunder.

#### Cocktailbar (FR-07-09, US-10-12)

| Endpoint | HTTP | Parametre | Statuskoder |
|----------|------|-----------|-------------|
| `/api/cocktail/sales` | GET | `aar` (valgfri; standard = `HISTORIK_AAR`, andre år giver 404, BR-06) | 200, 400, 404 |
| `/api/cocktail/sales/products` | GET | `aar` (som ovenfor) | 200, 400, 404 |
| `/api/cocktail/sales/distribution` | GET | `aar` (som ovenfor) | 200, 400, 404 |

`/api/cocktail/sales/distribution` returnerer **begge andele**: omsætningsandel (hovedtal) og enhedsandel pr. kategori (BR-07), procenter med 1 decimal.

#### Drift

| Endpoint | HTTP | Beskrivelse | Statuskoder |
|----------|------|-------------|-------------|
| `/health` | GET | Healthcheck til Docker Compose | 200 |

Sortering af revenue-resultater (så de højest indtjenende typer/lande kan identificeres, AC-07.4/AC-08.3) specificeres i OpenAPI-kontrakten som faldende sortering pr. omsætning som standard.

### Fejlformat

Alle fejl returneres som JSON med samme konvention som kontrakten (og valideres af express-openapi-validator):

- `error.code` (fx `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`)
- `error.message` (læsbar tekst)
- `error.details` (eventuelt felt-specifikke detaljer)

Uventede fejl (500) fanges af en global fejlhåndtering i `presentation/errors.js` og returneres i samme format uden interne detaljer.

Fejlsvar indeholder **aldrig stack traces eller interne detaljer** (NFR-10). Alle input valideres (validator + express-openapi-validator), og alle databaseforespørgsler er parametriserede (NFR-10, afsnit 1).

### Live-data

Definitionen fra Clarifications (C-01): **live = en ændring via POST/PUT/DELETE er synlig i næste GET-kald, uden caching.** Realisering:

- Hvert endpoint forespørger databasen direkte via data-laget ved hver request — ingen cache-lag.
- Nye/ændrede bookinger (US-05) er således synlige i API'et og i nøgletal straks efter gem.
- Dashboardet arver denne live-egenskab kun med forsinkelse (se afsnit 3.3): eksporten kører hvert 60. sekund (`EXPORT_INTERVAL_SECONDS=60`), herefter kræves manuel genindlæsning i Tableau.
- Senere optimering (cache med TTL, invalideret ved booking-ændringer) er mulig uden at ændre kontrakten.

---

## 7. Docker og drift

### Services (docker-compose.yml)

| Service | Image/build | Port | Bemærkning |
|---------|-------------|------|------------|
| `db` | mysql:8.0 | 3306 (kun internt; udadtil kun ved debug) | Healthcheck via `mysqladmin ping`; volume `mysql_data`; `./db` mountes i `/docker-entrypoint-initdb.d/` |
| `backend` | build `backend/Dockerfile` (node LTS på slim-base) | 8000 | Healthcheck kalder `/health`; afhænger af `db` (condition: service_healthy) |
| `frontend` | nginx:alpine med `nginx.conf` (statisk + `/api`-proxy) | 3000 | Ingen afhængighed af backend for at starte |
| `swagger-ui` | swaggerapi/swagger-ui | 8080 | Serverer `openapi/openapi.yaml` (mount `./openapi`) |
| `tableau-export` | build `tableau/Dockerfile` (python slim + tableauhyperapi) | – | **Eksternt værktøj** (afsnit 3); afhænger af `backend` (condition: service_healthy); volume `./extracts` monteres på værtsmaskinen |

Start med én kommando: `docker-compose up` starter alle fem services, også `tableau-export` (constitution princip V: db er sund, før backenden starter).

### Miljøvariabler

`.env` (ikke i git — mountes via Docker, aldrig committet; constitution princip VI) og `.env.example` (i git):

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_ROOT_PASSWORD` (db-init)
- `API_BASE_URL` (til tableau-export: `http://backend:8000`)
- `HISTORIK_AAR=2025` (året for de historiske ophold, BR-04)
- `EXPORT_INTERVAL_SECONDS=60` (tableau-exportens interval — besluttet, spec C-14/AC-05.4)

Ingen hårdkodede credentials eller forbindelsesstrenge — backendens `data/db.js` og mysql-servicen læser udelukkende miljøvariabler.

### Netværk og servicenavne

Alle services på ét bridge-netværk (`hk-network`). Interne kald bruger servicenavne, aldrig localhost: backend → `db:3306`, frontend-proxy → `http://backend:8000`, tableau-export → `http://backend:8000`.

### Start-rækkefølge

1. `db` starter, indlæser `db/`-filerne automatisk ved **første** opstart (kun når datamappen er tom).
2. `backend` venter på `db` er sund (`depends_on: condition: service_healthy`).
3. `frontend` og `swagger-ui` starter uafhængigt.
4. `tableau-export` starter, når backenden er sund.

### Volumes

- `mysql_data`: bevarer databasefiler mellem genstarter (constitution princip V).
- `./db` → `/docker-entrypoint-initdb.d/`: indlæser `01_schema.sql` → `02_data.sql` → `03_extensions.sql` → `04_rooms_seed.sql` i alfabetisk rækkefølge ved første opstart (constitution princip IV: schema og startdata i `db/`, automatisk). 01 og 02 er leveret fra MySQL Workbench og må ikke ændres. 04 er en antagelse til underviseren og er den eneste fil, der skal rettes, hvis fordelingen ændres.
- `./openapi` → swagger-ui-containeren.
- `./extracts` → tableau-export-containerens output-mappe (host-mount, så Tableau Desktop kan åbne filen direkte).

---

## 8. Test og kvalitet

### Test-runner: Nodes indbyggede vs. Jest

**Anbefaling: Nodes indbyggede test runner (`node --test`, `node:test`-modulet).**
- Nul ekstra afhængigheder og konfiguration; følger LTS-versionen; alle kan forklare det.
- Jest er mere velkendt for nogle og har rigere matchers/rapportering, men til et projekt af denne størrelse er indbygget runner tilstrækkelig og enklere.
- **Gruppebeslutning påkrævet** (hvis nogle i gruppen har stærk Jest-erfaring, kan valget vendes — begge understøtter samme testtyper).

### Test af nøgletal (constitution "Kvalitet og Test", NFR-07)

For hver nøgletalsberegning (belægningsgrad, omsætning pr. type/sæson/land/år, gæster pr. land, kundetilfredshed, cocktail-nøgletal):

1. Beregn værdien via API-endpointet.
2. Kør en **kontrolforespørgsel** direkte mod databasen med samme parametre, med `ROUND` (belægningsgrad: belagte værelsesnætter / (214 × nætter i perioden) — præcis BR-01, ikke bookinger/værelser).
3. Sammenlign inden for tolerancen **0,01 DKK for beløb og 0,1 procentpoint for procenter** (BR-02).
4. Test desuden tom periode (defineret nul/tom-værdi, ikke misvisende procent) og konsistens ved gentagen beregning.

### Test af bookingregler

Edge-case tests mod API'et: dobbeltbooking af samme værelse i overlappende periode → 409 (BR-10: overlap hvis `ny.check_in < eksisterende.check_out` AND `ny.check_out > eksisterende.check_in` — **udtjekning og ny indtjekning samme dag er tilladt**); `check_in >= check_out` → 400; `guest_count < 1` eller `guest_count > rooms.capacity` → 400 med fejlbesked (FR-01); `total_price <= 0` → 400; ukendt booking-id ved GET/PUT/DELETE → 404; oprettet booking returneres uændret.

### Test af sikkerhed (NFR-10)

- SQL-injektion-lignende input (fx `'; DROP TABLE bookings;--` i gæstenavn eller dato-felter) behandles som almindelig tekst: anmodningen afvises med 400 eller gemmes uskadt — tabellerne er uændrede, og der opstår ingen databasefejl.
- Fejlsvar indeholder ingen stack traces eller interne detaljer.

### Test af ydeevne (NFR-09)

Måling på demodatasættet: metrics-endpoints < 2 sekunder, booking-CRUD < 500 ms, fuld `.hyper`-eksport < 30 sekunder.

### Test af kontrakt-match (constitution princip III)

1. express-openapi-validator er monteret i test-appen: requests/responses, der afviger fra `openapi/openapi.yaml`, fejer testen.
2. En kontrakttest går specifikationens paths igennem og verificerer: hvert dokumenteret endpoint har en registreret Express-route, og hver registreret route er dokumenteret (med statuskoder og fejlformat).
3. Kontrakten opdateres i samme commit som API-ændringer (constitution III) — test 1-2 fanger, hvis det glemmes.

### Test af live-data

Opret booking via API → hent nøgletal straks efter → verificer at bookingen er medregnet. Opdatér booking → verificer opdateringen returneres.

### Systemtest

Manuel end-to-end: `docker-compose up` → frontend booking-CRUD → Swagger UI → nøgletal → `tableau-export` → `.hyper`-fil i Tableau Desktop.

---

## 9. Beslutninger og risici

### Beslutningstabel

| Beslutning | Valg | Alternativer | Begrundelse | Gruppebeslutning? |
|-------------|------|--------------|-------------|------------------|
| Backend-sprog og framework | Node.js (LTS) + **Express** | Fastify, Python/FastAPI (forrige plan), Java/Spring | Alle kan forklare koden (constitution "Ejerskab og AI"); Express er mest udbredt og mindst magisk; krav fra gruppen om JavaScript/Node | ✅ **Ja** — Express vs. Fastify skal godkendes |
| Database-driver | mysql2, rå parametriseret SQL | Knex (query builder), en ORM | Rå SQL i data-laget er gennemsigtigt og opfylder princip I direkte; Knex' abstraktion ikke nødvendig for projektets størrelse | ✅ **Ja** — Knex kan genovervejes |
| API-kontrakt | **Contract-first**: `openapi/openapi.yaml` først + express-openapi-validator | swagger-jsdoc (kodegenereret), Fastify-schemas | Constitution III kræver kontrakt og kode i sync — runtime-validering fanger drift; kodegenereret kontrakt forældes stille | ❌ Nej (anbefalet) |
| Swagger UI | Egen container (port 8080) | Kun integreret løsning | Constitution III + opgavens krav om container | ❌ Nej (valgt) |
| Frontend | Ren HTML/CSS/JS bag Nginx med `/api`-proxy | Framework, separat CORS-håndtering | Constitution VII (ingen framework); proxy fjerner CORS helt | ❌ Nej (valgt) |
| CORS-håndtering | Ingen (samme origin via proxy) | `Access-Control-Allow-Origin: *` i backend | Enklere og mere korrekt end wildcard-CORS | ❌ Nej (valgt) |
| Tableau-integration | Eksternt Python-script i egen container (`tableau-export`) → `.hyper`-fil | CSV-eksport, Java/C++ (Hyper API), WDC (deprecated) | Hyper API findes ikke til Node; WDC afskrevet; scriptet er isoleret og logikfrit | ✅ **Besluttet 2026-10-29** — undtagelsen er skrevet ind i constitution princip IX (v1.1.0) |
| Tableau-opdatering | Interval 60 sekunder (`EXPORT_INTERVAL_SECONDS=60`) | Manuel kørsel, længere interval | Aftalt i spec C-14/AC-05.4; kort nok til demo, stadig ikke real-time | ❌ Nej (besluttet) |
| Direkte MySQL til Tableau | Reservemetode — dokumenteret **afvigelse** | Ingen reserve | Backup hvis Hyper-script fejler før aflevering | ✅ **Ja** — konflikt med princip VIII, kræver godkendelse og notering i Converge |
| Test-runner | `node --test` | Jest | Nul afhængigheder, enklest at forklare | ✅ **Ja** — Jest hvis gruppen foretrækker det |
| Nøgletal i backend | Ja, i business-laget | I SQL-views/Tableau | Constitution VIII + testbarhed | ❌ Nej (valgt) |
| `tableau-export` | Starter med `docker-compose up` | Bag en profil, så den kun startes ved behov | Constitution V og opgaven kræver én kommando, og FR-02 siger, at eksporten kører hvert 60. sekund | ❌ Nej (følger constitution, T064) |
| Sprog for ressourcenavne | Engelsk endpoints (`/api/rooms`, `/api/bookings`, `/api/metrics/...`) | Dansk (`/api/vaerelser`) | Konsistens og udenlandske læsere | ❌ Nej (standardvalg, O-13) |

### Tekniske risici

| Risiko | Impact | Sandsynlighed | Mitigering |
|--------|--------|---------------|------------|
| Kontrakt og kode kommer ud af sync | Høj | Medium | Contract-first + express-openapi-validator + kontrakttest (afsnit 8) + samme-commit-regel |
| `tableauhyperapi`/Hyper-kompatibilitet (Python-version, Tableau-version) | Medium | Lav | Test scriptet tidligt mod aktuel Tableau Desktop-version; brug officiel pakke |
| Tableau-forbindelsen fejler ved aflevering | Høj | Lav | Reservemetode (afsnit 3.4) — kun med gruppegodkendelse; test ekstraktionen tidligt og ofte |
| Live-misforståelse (dashboard forventes real-time) | Medium | Høj | Dokumentér begrænsningen (afsnit 3.3) i README og i selve dashboard-teksten |
| Opstartsrækkefølge (backend starter før db er klar) | Høj | Medium | Healthchecks + `depends_on: condition: service_healthy` + `/health`-endpoint |
| Fil-konkurrence på `.hyper`-filen | Lav | Lav | Midlertidig fil + atomisk omdøbning (afsnit 3.1) |
| Windows/Docker Desktop-problemer (cron i container) | Medium | Medium | Brug simpel loop/interval i scriptet frem for cron, hvis cron er problematisk på host-OS |
| 2-ugers deadline | Høj | Medium | Lodrette dele: skelet først, derefter én user story ad gangen (constitution "Lodrette Dele"); P1-faser før P2 |
| Gruppens forståelse af koden | Høj | Lav | Korte reviews, par-programmering, `docs/ai-decisions.md` (constitution "Ejerskab og AI") |

### Kritiske afhængigheder

1. **Node LTS + Express + mysql2:** testes fra første dag i Fase 1 (skelettet).
2. **Docker på alle gruppemedlemmers maskiner:** test `docker-compose up` på tværs af maskiner tidligt.
3. **MySQL sundhed:** healthchecks er kritiske for opstarten.
4. **Tableau Desktop-licens:** kræves for at åbne `.hyper`-filer; Tableau Public (gratis) understøtter Hyper-filer som alternativ.
5. **Backend-API'ets endpoint-liste:** tableau-export og OpenAPI-kontrakten afhænger af, at alle nødvletal-endpoints findes og returnerer aftalte formater.

---

## 10. Constitution-check

| Princip | Status | Bemærkning |
|---------|--------|------------|
| I. 3-lags arkitektur | ✅ | SQL kun i `data/repositories/`; nøgletal kun i `business/services/` (afsnit 4) |
| II. REST/JSON API | ✅ | Substantiv-ressourcer, korrekte statuskoder (afsnit 6) |
| III. OpenAPI-kontrakt | ✅ | Contract-first + validator + egen Swagger UI-container (afsnit 2) |
| IV. Database | ✅ | MySQL; schema + startdata i `db/`, auto-indlæsning (afsnit 7) |
| V. Docker | ✅ | Alt i containere, og alle services starter med `docker-compose up` (afsnit 7) |
| VI. Konfiguration | ✅ | Miljøvariabler; `.env` ikke i git, `.env.example` i git (afsnit 7) |
| VII. Frontend | ✅ | Ren HTML/CSS/JS uden framework; booking-CRUD via API'et; API'et generelt brugbart af eksterne systemer |
| VIII. Analytics | ✅ (med én afvigelse) | Dashboard henter data via REST API (Hyper Extract); **reservemetode med direkte MySQL er en konflikt med VIII** — kun test/backup, kræver gruppegodkendelse og Converge-notering (afsnit 3.4) |
| IX. Ét backend-sprog | ✅ (med én undtagelse) | Node.js/JavaScript for hele backenden; **Python-script til Tableau er en begrundet undtagelse, der er skrevet ind i constitution princip IX (v1.1.0, godkendt 2026-10-29)** (eksternt værktøj, afsnit 3.2) |
| Kvalitet og test | ✅ | Kontrolforespørgsler, edge-case-tests, kontrakttest (afsnit 8) |
| Git og dokumentation | ✅ | Feature-branches, review før merge, README/CONTRIBUTE/Swagger løbende |

### Konflikter, der påpeges — ikke løses i denne plan

1. **Princip IX vs. Python-scriptet (afsnit 3.2):** **Afgjort 2026-10-29** — undtagelsen er skrevet ind i constitution princip IX (v1.1.0) med betingelserne: eksternt værktøj, egen container, ingen forretningslogik, ingen databaseadgang.
2. **Princip VIII vs. reservemetode (afsnit 3.4):** Reservemetoden (direkte MySQL) er en dokumenteret afvigelse. Den må **ikke** implementeres uden gruppegodkendelse; godkendelsesfrist: fredag den 30/10 (tasks åbent punkt O-10). Bruges den, noteres det i Converge-resultatet.
3. **Princip V vs. profil-afvigelse:** **Afgjort 2026-11-01** — profilen er fjernet, så `tableau-export` starter med `docker-compose up` (T064).
4. **Spec vs. plan (ingen konflikt fundet):** Endpoint-listen, nøgletal-definitionerne (BR-01-10), live-definitionen (C-01), kapacitetsreglen (FR-01) og ?aar=-reglen (BR-04) er identiske i spec.md og plan.md. Endpoint-navnene er engelske (beslutning bekræftes senest 30/10, tasks O-13).
5. **Resterende gruppebeslutninger (frist fredag 30/10):** Express vs. Fastify, Knex, `node --test` vs. Jest (tasks åbent punkt O-8) samt ressourcesprog (O-13). Planen følger sine anbefalinger som standardvalg indtil da.

---

## Næste skridt

1. **Resterende gruppebeslutninger (tasks åbne punkter O-8, O-10 og T067):**
   - Express vs. Fastify, Knex, `node --test` vs. Jest (O-8 — planens anbefalinger er standardvalg)
   - Reservemetodens status (O-10: implementeres ikke uden godkendelse) og CORS til Swagger UI (T067)
   - Ressourcesprog (O-13) følger standardvalget engelsk, og kapacitet (O-15) er afgjort i spec session 2026-11-01
2. **`db/` er på plads:** `01_schema.sql` og `02_data.sql` er leveret, og `03_extensions.sql` og `04_rooms_seed.sql` er tilføjet. Verificeres med `scripts/verificer.ps1`.
3. **MVP (constitution "Lodrette Dele"):** docker-compose med db + backend med ét endpoint (`GET /api/room-types`) gennem alle tre lag + `/health` + Swagger UI + frontend-skelet — tasks Fase 1.
4. **Tidlig Tableau-test:** opbyg `tableau-export`-containeren tidligt (interval `EXPORT_INTERVAL_SECONDS=60`) og verificér `.hyper`-filen i Tableau Desktop, før dashboard-opgaverne påbegyndes.
