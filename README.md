# Hotel Kong Arthur · uge 2

Uge 2 er en bookingløsning med en særskilt analysefane for importerede hotel- og bardata. Backend og frontend kører i Docker Compose, og uge 2 bruger PostgreSQL. Projektet indeholder også uge 1's MySQL-baserede booking-POC; den starter med sin egen Compose-fil og har sin egen databasevolumen.

## Uge 1 og uge 2

| | Uge 1 · POC | Uge 2 |
|---|---|---|
| Compose-fil | `compose.yaml` | `compose.uge2.yaml` |
| Database | MySQL 8 | PostgreSQL 16 |
| Frontend | Port 8080 | Port 8081 |
| Backend-port på værten | 3000 | 3001 |
| Data | Bookinger og eksempeldata fra MySQL-initfilen | Bookinger samt særskilt importerede hotel- og bardata |

Uge 2 erstatter eller migrerer ikke uge 1. De to stacks har forskellige databaser, porte og Compose-projekter. Brug den relevante Compose-fil til den stack, du vil arbejde med.

## Arkitektur

Uge 2 har tre lag i backend:

1. **Routes** modtager HTTP-kald, læser sti og filtre og sender resultat eller fejl tilbage.
2. **Services** håndterer validering, bookingregler og analyseberegninger.
3. **Repositories** udfører SQL mod PostgreSQL. SQL for booking og analyse ligger her.

Frontend er statiske HTML-, CSS- og JavaScript-filer serveret af Nginx. Nginx videresender `/api/` og `/api-docs/` til backend. Docker Compose starter PostgreSQL, backend og frontend; backend venter på PostgreSQLs healthcheck, og frontend venter på backendens healthcheck. PostgreSQL er kun tilgængelig internt på Compose-netværket. Frontend og backend har henholdsvis værtsport 8081 og 3001.

Regnearksimporten er et separat Python-script, som validerer XLSX-filerne og skriver direkte til PostgreSQL. Den går uden om API'ets routes, services og repositories.

## Start uge 2 fra en frisk kopi

Forudsætninger: Git, Docker Desktop med Compose-plugin og Python 3. Kommandoerne herunder er skrevet til macOS/Linux-shell og køres fra projektroden. Python-scriptet bruger kun Python-standardbiblioteket.

### 1. Hent projektet

Indsæt gruppens GitHub-klonadresse i stedet for `<repo-url>`:

```sh
git clone <repo-url> Hotel-uge2
cd Hotel-uge2
```

Datasættene forventes i `Datasets/`: `international_names_with_rooms_1000.xlsx` og `drinks_menu_with_sales.xlsx`.

### 2. Opret lokal miljøfil

```sh
cp .env.example .env
```

Åbn `.env`, og sæt en lokal værdi til `POSTGRES_PASSWORD`. De øvrige eksempelværdier er `POSTGRES_DB=hka_uge2` og `POSTGRES_USER=hka_uge2`. `.env` er udelukket fra Git; del eller upload den ikke.

### 3. Start tjenesterne

```sh
docker compose --env-file .env -f compose.uge2.yaml up --build -d
```

Vent på at tjenesterne er startet, og kontrollér status:

```sh
docker compose --env-file .env -f compose.uge2.yaml ps
```

Fortsæt, når `postgres` og `backend` er `healthy`, og `frontend` er `running`.

### 4. Importér analysedata

Kør først, når PostgreSQL er startet:

```sh
python3 scripts/import_datasets.py
```

Scriptet kontrollerer kolonner, celletyper, obligatoriske værdier og antal rækker. Det forventer 1.000 hotelrækker og 30 drinkprodukter. Ved fejl afbryder det og viser fil, Excel-række og felt. Det importerer til uge 2's PostgreSQL og kontrollerer databasens antal og summer mod en beregning fra regnearkene. Gentagelse af kommandoen opdaterer samme kildeark/række uden dubletter.

### 5. Kontrollér installationen

Åbn adresserne nedenfor. Backendens healthcheck og booking-API kan også kontrolleres fra terminalen:

```sh
curl -fsS http://localhost:3001/health
curl -fsS http://localhost:8081/api/bookings
```

`/health` er tilgængelig via backend-porten 3001. Frontendens Nginx videresender `/api/` og `/api-docs/`, men ikke `/health`.

| Funktion | Adresse |
|---|---|
| Frontend og bookinger | <http://localhost:8081/> |
| Analysefane | <http://localhost:8081/#analysis> |
| Swagger UI | <http://localhost:8081/api-docs/> |
| Booking-API gennem Nginx | <http://localhost:8081/api/bookings> |
| Analyse-API gennem Nginx | <http://localhost:8081/api/analysis/hotel/summary> |
| Booking-API direkte | <http://localhost:3001/api/bookings> |
| Backend healthcheck | <http://localhost:3001/health> |
| Tableau Web Data Connector | <http://localhost:8081/tableau.html> |

> **Frisk-clone-kontrol:** Trinene ovenfor er dokumenteret ud fra Compose-, miljø- og importfilerne. En fuld opstart og import fra en ny Git-clone er ikke registreret som testet. Markér ikke den kontrol som bestået, før den er gennemført.

## Booking-API

Alle ruter ligger under `/api/bookings`:

| Metode | Rute | Funktion |
|---|---|---|
| GET | `/api/bookings` | Hent alle bookinger. |
| GET | `/api/bookings/{id}` | Hent én booking. |
| POST | `/api/bookings` | Opret booking; svarer med HTTP 201. |
| PUT | `/api/bookings/{id}` | Opdatér bookingens felter. |
| DELETE | `/api/bookings/{id}` | Slet booking; svarer med HTTP 204. |

Bookingfelter er `guestName`, `email`, `roomNumber`, `checkIn`, `checkOut` og `status`. Datoer bruger `YYYY-MM-DD`; afrejse skal være efter ankomst. Status kan være `confirmed`, `cancelled`, `checked_in` eller `checked_out`. POST vælger `confirmed`, hvis status udelades. PUT kræver hele det redigerbare feltsæt. Ugyldige felter giver HTTP 400, ukendte ID'er 404 og interne fejl 500. Systemet kontrollerer ikke, om værelset findes, eller om bookinger overlapper.

## Analyse-API og beregninger

Analyse-API'et har ni endpoint-ruter. `/api/analysis/hotel/top-revenue` er én rute med `groupBy=country` eller `groupBy=roomType`.

| Endpoint | Resultat |
|---|---|
| `/api/analysis/hotel/summary` | Samlet hotelbeløb, antal registrerede ophold og gennemsnitlig `Days Rented`. |
| `/api/analysis/hotel/stay-counts-by-country` | Antal rækker pr. land. |
| `/api/analysis/hotel/revenue-by-country` | Hotelbeløb og antal pr. land. |
| `/api/analysis/hotel/revenue-by-room-type-season` | Hotelbeløb efter værelsestype og kildens sæson. |
| `/api/analysis/hotel/top-revenue?groupBy=country` | Land(e) med højest beløb; delte førstepladser medtages. Brug `groupBy=roomType` for værelsestype. |
| `/api/analysis/hotel/average-stay-length` | Gennemsnitlig `Days Rented`. |
| `/api/analysis/bar/summary` | Antal produkter, solgte enheder og samlet barbeløb. |
| `/api/analysis/bar/products` | Stykpris, antal solgte enheder og beløb pr. drink. |
| `/api/analysis/bar/category-shares` | Cocktail-/kaffeandele efter antal solgte enheder. |

Hotelruterne accepterer filtre på `country`, `roomType` og `season`. Barens summary og produktliste accepterer `category`. Ukendte filtre og værdier giver HTTP 400. Et gyldigt filter uden resultater giver tomme grupper eller nulmål. Svarene indeholder datagrundlag, POC-antagelser, filtre og data; beløb leveres som DKK-decimaler med to decimaler.

### Kilder og POC-antagelser

- `Datasets/international_names_with_rooms_1000.xlsx` indeholder 1.000 hotelrækker med blandt andet land, værelsestype, `Days Rented`, sæson og `Price`.
- `Datasets/drinks_menu_with_sales.xlsx` indeholder 30 produkter med kategori, `Price (DKK)` og `Units Sold`.
- Hotellets `Price` behandles som den samlede pris for ét registreret ophold. Drinkens `Price` behandles som stykpris, og omsætning beregnes som `Price × Units Sold`. Det er POC-antagelser.
- Datasættene indeholder ikke et dokumenteret rapporteringsår eller salgsdato/sælger. Beløbene er derfor ikke årsomsætning eller Helenes salg. Der beregnes heller ikke belægning.

Browserens bookinger gemmes i `bookings`. De importerede hotelrækker og drinkprodukter gemmes separat i `hotel_stays` og `drink_products`. De importerede hotelrækker er ikke bookingposter: kilden mangler bookingdatoer og værelsesnumre, og importen føjer dem ikke til. Uge 2 importerer heller ikke bookinger fra uge 1.

## Tableau

Åbn <http://localhost:8081/tableau.html> i Tableau som Web Data Connector, og vælg **Hent data til Tableau**. Connectoren tilbyder bookingtabellen og særskilte analysetabeller, der henter beregnede resultater fra uge 2-API'et. Samlede hotel- og bartotaler ligger i hver sin én-rækkes tabel; gruppetabeller indeholder ikke gentagne totaler.

Når API-data er opdateret, opdatér Tableau-udtrækket manuelt via **Data → [dataudtræk] → Refresh**. Automatisk opdatering er ikke dokumenteret eller verificeret. Tableau-versionens reproducerbarhed på andre computere er heller ikke verificeret.

## Teststatus og åbne punkter

Status nedenfor bygger på resultater registreret i `specs/Tasks` pr. 2. november 2026; browserobservationer er brugerbekræftede.

**Kontrolleret:**

- Uge 2-importen blev kørt to gange mod den eksisterende stack. Begge gange blev der registreret 1.000 hotelrækker med `SUM(Price) = 11.234.034,00 kr.` og 30 drinkprodukter med 179.958 solgte enheder og `SUM(Price × Units Sold) = 13.448.640,34 kr.` Summerne matchede en beregning fra XLSX-cellerne.
- API-kontrol dækkede booking-CRUD, valideringsfejl, ukendte booking-ID'er og persistens efter genstart af PostgreSQL. Testbookingen blev slettet.
- Analyseberegninger og de ni endpoint-ruter blev kontrolleret mod kildedata/API-svar; Swagger UI svarede HTTP 200.
- Brugerens frontendkontrol i Safari bekræftede standardtotaler: 11.234.034 kr., 1.000 ophold, 5,379 dage og 13.448.640,34 kr. for baren. `Suite + high` viste 693.222 kr., 45 ophold og 4,756 dage. `Coffee` viste 6.343.884,91 kr. i baromsætning med uændrede hoteltal. Nulstilling gendannede totalerne. Beløbs- og tabel-layout blev også kontrolleret i Safari.
- Tableau viste hoteloversigt, baroversigt, hotelbeløb pr. land og pr. værelsestype/sæson. Manuel Refresh lykkedes for hoteloversigt, baroversigt og landefordeling. En teknisk harness dækkede alle ti analysetabel-varianter (top-ruten med begge `groupBy`-værdier).
- GitHub-upload af layoutrettelsen er oplyst af brugeren; uploaden er ikke kontrolleret i denne dokumentation.

**Ikke kontrolleret eller fortsat åbent:**

- Fuld opstart og dataimport fra en helt frisk Git-clone.
- Øvrige kombinationer af analysefiltre, analysefanens Opdatér-knap og genindlæsning af analysesiden.
- De øvrige Tableau-analysetabeller og Tableau-connectorens reproducerbarhed på andre computere; automatisk refresh.
- Årsomsætning, Helenes salg og belægning. De nødvendige datoer, sælgeroplysninger og kapacitetsdata/regler findes ikke i de nuværende kilder.

Uge 2 er dermed implementeret og delvist verificeret; den samlede løsning og alle krav er ikke markeret færdige. Se [specs/Tasks](specs/Tasks) for taskstatus og testdetaljer.

## Stop, start og bevar databasen

Stop uge 2-tjenesterne:

```sh
docker compose --env-file .env -f compose.uge2.yaml stop
```

Start de stoppede containere igen uden at genbygge:

```sh
docker compose --env-file .env -f compose.uge2.yaml start
```

Eller fjern containerne/netværket, men behold named volume, og opret dem igen senere:

```sh
docker compose --env-file .env -f compose.uge2.yaml down
docker compose --env-file .env -f compose.uge2.yaml up -d
```

Compose-projektnavnet er `hka-uge2`, og PostgreSQL-data ligger i volumen `hka-uge2_postgres_data`. `stop`, `start`, `down` og `up` sletter ikke den volumen. Brug **ikke** `down -v` eller volume-prune, hvis data skal bevares. Importen er idempotent og kan køres igen efter opstart.

## Bevar uge 1's MySQL-POC separat

Uge 1 bruger `compose.yaml`, MySQL og volumen `hotel_mysql_data` med et Compose-projektnavn, der afledes af projektmappen. Dens værtsporte er frontend 8080 og backend 3000; MySQL-port 3306 er kun intern i Compose-netværket. Uge 1's initfil er `mysql/init.sql`.

Læg uge 1's egne MySQL-værdier i en lokal `.env.mysql` (filen er ignoreret af Git):

```dotenv
MYSQL_ROOT_PASSWORD=vælg_en_lokal_adgangskode
MYSQL_PASSWORD=vælg_en_lokal_app_adgangskode
MYSQL_USER=hoteluser
MYSQL_DATABASE=hotel_db
```

Start kun uge 1 med:

```sh
docker compose --env-file .env.mysql -f compose.yaml up --build -d
```

Uge 1's frontend er <http://localhost:8080/>, Swagger er <http://localhost:8080/api-docs/>, og dens Tableau-connector er <http://localhost:8080/tableau.html>. Bevar dens data ved at bruge samme projektmappe/projektnavn og undgå `docker compose ... down -v`.

De to `.env`-filer og de to PostgreSQL/MySQL-volumener er separate. Start ikke begge stacks på én gang, hvis værtsportene 8080 eller 3000 allerede er i brug.

## Projektmateriale

- [specs/Specify](specs/Specify): krav og acceptkriterier.
- [specs/Clarify](specs/Clarify): afklaringer om data og beregninger.
- [specs/Plan](specs/Plan): arkitektur og plan.
- [specs/Tasks](specs/Tasks): opgaver, teststatus og åbent arbejde.
- [specs/Converge](specs/Converge): samlet kontrolrapport.
- [CONTRIBUTE.md](CONTRIBUTE.md): samarbejdsvejledning.
