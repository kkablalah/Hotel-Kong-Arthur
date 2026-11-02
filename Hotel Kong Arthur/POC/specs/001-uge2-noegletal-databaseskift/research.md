# Research: Tillægsopgave uge 2

Beslutninger bag [plan.md](plan.md). Ingen uafklarede punkter tilbage. Underviserens bekræftelse af D-01 afventer.

## D-01: Database

- **Decision**: PostgreSQL 18 i containeren `postgres:18`.
- **Rationale**: Hotellet kræver en anden databasetype end MySQL. PostgreSQL er et selvstændigt system med eksakte decimaler og streng håndhævelse af typer og `CHECK`.
- **Alternatives considered**: MariaDB er fravalgt, fordi det er en udløber af MySQL, og det derfor er tvivlsomt, om det er en anden type. Andre databaser er ikke vurderet, fordi skiftet allerede er kodet.

## D-02: Status 400 i `db.js`

- **Decision**: Erstattes af en neutral `InvalidValueError` i data-laget, som presentation oversætter til 400.
- **Rationale**: En HTTP-status hører til i presentation (constitution I). FR-017 tillader ændringen, fordi den skyldes FR-021. Presentation kender stadig ikke databasen, for kun `db.js` kender fejlkoderne (constitution IV).
- **Alternatives considered**: At fastholde status 400 som dokumenteret afvigelse kræver mindre arbejde, men bevarer en afvigelse fra constitutionen, som kan undgås med få linjer.
- **Lagdeling**: `data/errors.js` definerer fejlen, og `business/errors.js` gør den tilgængelig, så presentation kun afhænger af laget lige under.

## D-03: Kontrakten som første lag

- **Decision**: `maximum` og `pattern` i kontrakten og fuld datokontrol i validatoren.
- **Rationale**: FR-025 kræver grænserne i kontrakten under alle omstændigheder. Reglerne gælder dermed uafhængigt af databasen og kan læses af IT. En afvist værdi når aldrig en `INSERT`, så sekvensen ikke får huller.
- **Målt**: `fast` godkender `2026-02-30` og `2026-02-29`. `full` afviser dem, men godkender `0000-01-01`. Validatorens standard er `fast`. Målt direkte med `ajv` og `ajv-formats`, ikke gennem hele API'et.
- **Alternatives considered**: Kontrol i `bookingValidator.js` dækker ikke alle endpoints med datoer. Kun at stole på databasen gør reglen afhængig af databasevalget.

## D-04: Hvilke databasefejl giver 400

- **Decision**: `22001`, `22003`, `22007`, `22008`, `22021` og `22P02`.
- **Rationale**: Det er for lang tekst, tal uden for området, ugyldig dato, dato uden for området, ugyldigt tegn (nulbyte) og forkert format. Resten af fejlklasse 22, fx division med nul, er en systemfejl og skal give 500.
- **Alternatives considered**: Hele klasse 22, som i dag, gør egne fejl til input-fejl.

## D-05: Rækkefølge ved lige værdier

- **Decision**: I business, med sammenligning tegn for tegn efter `group`, `country`, `drink` eller `category`.
- **Rationale**: Sorteringen ligger allerede i business. Rækkefølgen afhænger dermed hverken af databasens sprogindstilling eller af Node.js' sprogdata.
- **Målt**: I startdata er der kun lige værdier i N1: Vietnam og France (52), Canada og Japan (46), Spain og Italy (48), India og Sweden (61), Germany og United States (43).
- **Alternatives considered**: `ORDER BY` i SQL afhænger af sprogindstillingen. `localeCompare` afhænger af miljøet.

## D-06 til D-08: Frontend

- **Decision**: Egen side, en hentning pr. beregning, og forklaring ud fra `period` og `includes_history`.
- **Rationale**: FR-011 kræver, at bookingsiden er uændret, så den ikke må blive større. Hver hentning for sig gør, at en fejl kun rammer ét tal, og FR-008 kan vise den rigtige tekst pr. tal. Forklaringen følger API'et, så den ikke kan komme i modstrid med tallene.
- **Alternatives considered**: En sektion i `index.html` blander bookinger og ledelsens tal. Ét samlet endpoint er forbudt af FR-002.

## D-09: Demodata, størrelse

- **Decision**: 150 bookinger på 6 nætter, i alt 900 værelsesnætter, jævnt fordelt over året på 150 forskellige værelser.
- **Rationale**: SC-013 kræver mindst 1,0 % for hele indeværende år: 782 nætter i et almindeligt år og 784 i et skudår. 900 nætter giver 1,152 % og 1,149 % og plads til, at 19 bookinger springes over ved 409. Hver måned ender også på mindst 1,04 %. Tallene er simuleret for 2026, 2027 og 2028.
- **Alternatives considered**: 131 bookinger er det mindste, der opfylder kravet, men giver ingen margen. Koncentration i én måned kræver kun 67 nætter, men opfylder ikke kravet for året. Månedstallet på ca. 64 nætter gælder en måned på 30 dage, hvor kravet præcis er 65, fordi 64 nætter er 0,997 %.

## D-10: SQL og REST API'et

- **Decision**: `scripts/demodata.sql` er en `SELECT`, der danner rækkerne, og `scripts/demodata.ps1` opretter dem gennem REST API'et.
- **Rationale**: Gruppen vil generere rækkerne med SQL, og FR-027 kræver REST API'et, så bookingreglerne gælder. Sådan opfyldes begge dele.
- **Alternatives considered**: Direkte `INSERT` er hurtigere, men strider mod FR-027 og springer bookingreglerne over. En løkke i PowerShell undgår SQL uden for data-laget, men er fravalgt, fordi gruppen valgte SQL. Se Complexity Tracking i planen.

## D-11: Mærkning

- **Decision**: Efternavnet `DEMO-DATA`.
- **Rationale**: FR-028 forbyder nye felter i API'ets svar, og FR-027 kræver mærkning i gæstenavnet. Navnet kan både ses i bookinglisten og findes af frontenden og scriptet.
- **Alternatives considered**: En ny kolonne kræver en ændring af datamodellen og API'et.

## D-12: Sammenligning med `v1-mysql`

- **Decision**: PowerShell og `git worktree`. Systemerne kører efter hinanden, og version 1 har sit eget projektnavn.
- **Rationale**: Begge bruger samme porte, og begge mapper hedder `POC`, så uden eget projektnavn kan `down -v` ramme den forkerte volumen. Scripts i PowerShell følger projektets øvrige scripts og kræver ikke Node.js på værtsmaskinen.
- **Alternatives considered**: At køre samtidigt kræver andre porte i version 1 og dermed en ændring af det frosne system.

## D-13: Gammel dokumentation

- **Decision**: B-rækker og AI-beslutninger, der beskriver MySQL, bevares. Nye tilføjes fra B-55.
- **Rationale**: De er historik og forklarer forløbet til præsentationen. FR-020 gælder vejledninger, der beskriver den database, systemet bruger nu.
- **Alternatives considered**: At omskrive historikken ville skjule, at beslutningerne blev truffet for MySQL.
