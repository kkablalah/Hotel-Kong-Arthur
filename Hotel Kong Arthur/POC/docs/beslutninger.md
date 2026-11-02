# Beslutninger og antagelser

Her står de beslutninger og antagelser, der træffes under implementeringen, med en kort begrundelse, så gruppen kan forklare dem til præsentationen. Spec, plan, tasks og constitution er stadig de styrende dokumenter.

**Status**: `Beslutning` er truffet og gælder. `Antagelse` gælder, indtil gruppen siger andet.

## Fase 1: Skelet

| ID | Task | Type | Hvad | Hvorfor |
|---|---|---|---|---|
| B-01 | T001 | Antagelse | Repositoryets rod er mappen `POC/`. | `.specify/`, `specs/` og `db/` ligger her. Der er endnu intet git-repository. |
| B-02 | T001 | Beslutning | O-8 følger standardvalget i tasks.md: Express, mysql2 uden Knex og `node --test`. | O-8 er ikke afgjort, og fristen 30/10 er overskredet. Tasks siger, at standardvalget så gælder. |
| B-03 | T001 | Beslutning | `.nvmrc` er Node 26.13.0. | Det var den nyeste LTS-version på nodejs.org den 1/11, og T001 kræver aktuel LTS. Versionen på den enkeltes maskine betyder kun noget uden for Docker. |
| B-04 | T001 | Antagelse | `dotenv` er med i `package.json`, som T001 kræver. Gruppen vurderer, om den skal blive. | Den er kun nødvendig, hvis backenden startes uden for Docker. I Docker giver docker-compose allerede miljøvariablerne (plan afsnit 7). |
| B-05 | T001 | Beslutning | `package-lock.json` er med i repositoryet. | Alle 5 og Docker får præcis de samme pakkeversioner. |
| B-06 | T001 | Beslutning | Tomme mapper har en `.gitkeep`-fil. | Git gemmer ikke tomme mapper, så strukturen ville ellers forsvinde ved commit. Filerne kan slettes, når mappen får indhold. |
| B-07 | Alle | Beslutning | Implementeringen er startet, selv om alle 293 punkter i de tre tjeklister står åbne. | Gruppen har bedt om Fase 1 efter at have set tjeklisterne. Punkter, der blokerer, skrives her eller som åbne punkter. |
| B-08 | Alle | Beslutning | Systemet er verificeret i Docker på den stationære computer og flyttes bagefter til den bærbare som en zip-fil. | Gruppemedlemmet installerede Docker Desktop på den stationære. |
| B-09 | Alle | Beslutning | Commit, push og pull laves af gruppen selv i Visual Studio, ikke af kodeagenten. | Alle 5 skal committe under eget navn (constitution "Git"). |
| B-10 | T002 | Beslutning | `.gitignore` har ud over T002's fire linjer også `*.log`, `.vs/`, `.vscode/`, `Thumbs.db` og `.DS_Store`. | Logfiler og editorfiler hører ikke hjemme i git. `.env*` er bevidst ikke brugt, for så ville `.env.example` også blive udeladt. |
| B-11 | T003 | Beslutning | `DB_NAME=hotel`, `DB_HOST=db` og `DB_PORT=3306`. | `db/`-filerne har ingen CREATE DATABASE, så databasen `hotel` oprettes af `MYSQL_DATABASE`. `db` er servicenavnet i docker-compose (plan afsnit 7). |
| B-12 | T003 | Antagelse | Backenden logger ind som brugeren `hotel_app`, ikke som root. | Plan afsnit 7 angiver kun variablen `DB_USER`, ikke værdien. Backenden skal ikke have flere rettigheder end nødvendigt. |
| B-13 | T003 | Beslutning | `.env.example` har kun pladsholdere (`skift_mig`). `.env` har tilfældige adgangskoder og oprettes på hver maskine. | Hemmeligheder må ikke i git (constitution princip VI). Pladsholderne virker, men skal skiftes. |
| B-14 | T003 | Beslutning | `EXTRACT_OUTPUT_PATH` er ikke med endnu. | T003 og plan afsnit 7 nævner den ikke. Den bruges først af T051-T052 i Fase 8. |
| B-15 | T004, T005 | Beslutning | `db/01_schema.sql` og `db/02_data.sql` er kilden og må ikke ændres. De erstatter tabellerne og tallene i T004 og T005 (fx 214 værelser og medarbejdere). **Afvigelse fra T004 og T005.** | Filerne er leveret fra MySQL Workbench, og de tabeller, tasks nævner, findes ikke i dem. |
| B-16 | T006 | Beslutning | Løsning B: tabellen `rooms` oprettes, og `bookings` peger på et bestemt værelse med `room_id`. | FR-01 og BR-10 kan så bruges, som de er skrevet, og 409 ved dobbeltbooking kan vises i demoen. |
| B-17 | T006 | Antagelse | Gæsten står direkte i `bookings` (`first_name`, `family_name`, `country_id`), som i `stays`. **Afvigelse fra plan afsnit 5.** | Tabellen `guests` findes ikke, og `stays` gemmer gæsten på samme måde. |
| B-18 | T006 | Antagelse | `country_id` må være tom i `bookings`. | En gæst uden land skal vises som "Ukendt" og tælle med i totaler (AC-08.4). |
| B-19 | T006 | Antagelse | Slettes en booking, slettes dens ratings også (`ON DELETE CASCADE`). | DELETE skal give 204 (plan afsnit 6), og BR-08 tæller kun ratings knyttet til eksisterende bookinger. |
| B-20 | T006 | Beslutning | `03_extensions.sql` har ingen data, og der laves ingen demodata. | Gruppen har besluttet, at der ikke opfindes data. Spec og tasks er rettet (B-49). |
| B-21 | T006 | Beslutning | `guest_count` og `capacity` skal i databasen ligge mellem 1 og 4. Grænsen for det enkelte værelse tjekkes i business-laget. | Spec FR-01 siger, at kapacitet er mellem 1 og 4. |
| B-22 | T006 | Beslutning | `room_number` er kun et løbenummer, og `is_active` følger plan afsnit 5, men bruges ikke af nogen regel endnu. | Dataene har ingen værelsesnumre. |
| B-23 | T007 | Beslutning | Skelettet bruger `GET /api/room-types`, og `GET /api/rooms` findes også, nu hvor `rooms` har rækker. | `room_types` har leverede data, så skelettet ikke afhænger af antagelser. Tasks og plan er rettet, så det ikke længere er en afvigelse. |
| B-24 | T007 | Beslutning | Kontrakten bruger OpenAPI 3.0.3 og `additionalProperties: false`, og `servers` peger på `http://localhost:8000`. | Svar med uventede felter bliver dermed fanget af validatoren, og Swagger UI ved, hvor API'et ligger. |
| B-25 | T008 | Beslutning | Forbindelsen bruger `dateStrings: true`, og beløb beholdes som tekst, som mysql2 leverer dem. | Datoer forbliver `YYYY-MM-DD` uden tidszoneskift, og DECIMAL mister ikke øre ved at blive til kommatal. |
| B-26 | T008 | Beslutning | Backenden stopper straks med en fejl, der nævner navnene på manglende miljøvariabler, aldrig deres værdier. | En manglende `.env` er nem at finde, og adgangskoder kommer ikke i logfiler. |
| B-27 | T009 | Beslutning | Filen hedder `roomTypeRepository.js`, ikke `roomRepository.js`. **Afvigelse fra T009**, som følger af B-23. | Den læser kun `room_types`. Tabellen `rooms` er tom, og navnet skal passe til indholdet. |
| B-28 | T018-T027 | Beslutning | Blokeringen af T018, T020, T023 og T025 er fjernet. | Kapacitet og værelser er nu fastlagt som antagelser (B-45 til B-47), så der kan oprettes bookinger. |
| B-29 | T035 | Antagelse | En periode er med begge datoer, så 1.-31. januar er 31 nætter. | Spec siger ikke, om `end_date` tæller med (CHK182 i tjeklisten). |
| B-30 | T033, T035 | Antagelse til underviser | `stays` hører til året i `HISTORIK_AAR` (standard 2025). Nye bookinger tæller i det år, de tjekker ind. Med en datoperiode, og for belægning, RevPAR og ADR, tæller kun `bookings`. | `stays` har ingen datoer. Gruppen valgte året, så `?aar=2025` giver 11234034,00 DKK. Spec BR-04 er rettet. |
| B-31 | T035 | Beslutning | Uden `aar` bruges `HISTORIK_AAR`. | Det er det eneste år med komplette data (BR-04). Indeværende år er ikke afsluttet. |
| B-32 | T044, T045 | Antagelse til underviser | Alt salg i `drinks` regnes som Helene Christines og hører til `HISTORIK_AAR`. Andre år giver 404. | Gruppen bekræftede tolkningen, og Opgaven siger, at hun laver alle 30 drikke og beder om salget "for året". Der er ikke opfundet salgsrækker. Spec BR-06 og FR-07 er rettet. |
| B-33 | T033, T035 | Antagelse | En booking tæller med hele sit beløb i den periode, det år og den sæson, hvor indtjekningen ligger. Belægning tæller derimod nætter efter BR-01. | Spec definerer ikke bookinger, der krydser en grænse (CHK-punkt om AC-07.5). RevPAR og ADR kan derfor afvige lidt i kanten af en periode. |
| B-34 | T030 | Beslutning | `group_by` har også værdien `type_season`. **Afvigelse fra plan afsnit 6.** | Opgaven kræver indtjening pr. værelsestype pr. sæson, og planens `group_by` kunne kun tage én dimension. |
| B-35 | T032, T033 | Beslutning | Nattælling, sæson og omsætningssummer ligger i business-laget. Repositories henter kun rækker og simple summer. **Afvigelse fra T032 og T033.** | Constitution princip I går forud: beregninger hører til i logiklaget, og sæson er en regel i `season.js`. |
| B-36 | T034 | Antagelse | "Gæster pr. land" tæller ophold (`stays_count`), ikke personer. | `stays` har ikke antal gæster, og samme navn kan gå igen uden at være samme gæst. |
| B-37 | T039, T040 | Antagelse | Ratings tæller efter bookingens indtjekningsdato, gennemsnittet har 2 decimaler, og det er `null` uden ratings. | Spec fastlægger hverken dato eller decimaler. BR-08 kræver et tomt resultat i stedet for et misvisende gennemsnit. |
| B-38 | T012 | Beslutning | Validatoren tjekker både requests og responses hele tiden. Planens warn-mode bruges ikke. | Kontrakt og kode skal altid stemme overens (constitution princip III), og en prototype har ingen særskilt produktion. |
| B-39 | T012 | Beslutning | Backenden tillader kald fra `http://localhost:8080`. **Afvigelse fra plan afsnit 1** (ingen CORS). | Swagger UI kører på en anden port, og "Try it out" virker ellers ikke. Frontenden bruger stadig proxien. |
| B-40 | T015 | Beslutning | Nginx slår `backend` op ved hvert kald via Docker-DNS. **Afvigelse fra T015**, som har en fast `proxy_pass`. | Med en fast adresse stopper Nginx, hvis backenden ikke kører endnu, og frontend skal kunne starte uafhængigt (plan afsnit 7). |
| B-41 | T015, T025 | Beslutning | `GET /api/rooms` og `GET /api/countries` er tilføjet. `GET /api/rooms` er tom indtil videre. | Bookingformularen skal kunne vælge værelse og land. |
| B-42 | T021 | Antagelse | Et `room_id` eller `country_id`, der ikke findes, giver 400. | Planen angiver ingen statuskode for tilfældet. 404 er forbeholdt selve bookingen. |
| B-43 | T021 | Beslutning | Dobbeltbooking tjekkes uden databaselås. To samtidige kald kan derfor i teorien begge komme igennem. | Bevidst fravalg i en prototype, så koden forbliver enkel. Står som kendt begrænsning i README. |
| B-44 | T016, T051, T052 | Beslutning | Eksporten bruger indeværende år og dets måneder, kan køre én gang med `--once` og beholder den forrige fil ved fejl. MySQL-healthchecket går over TCP, og `extracts` er en mappe på værten, ikke en navngiven volume. **Afvigelse fra T016.** | T053 skal kunne køre én gang, og Tableau skal altid kunne åbne en hel fil. TCP svarer først, når `db/`-filerne er indlæst. |
| B-45 | T006 | Beslutning | Kapacitet kommer fra "Max antal gæster" på arthurhotels.dk/hotel-kong-arthur/vaerelser/ (læst 2026-11-01). | Opgaven linker til siden, og de leverede data har ikke kapacitet. |
| B-46 | T006 | Antagelse til underviser | De 214 værelser er fordelt efter antal ophold pr. type i `stays`: Grand Lit 25, Junior Suite 29, LOFT Suite 22, Spa Executive 30, Standard Double 25, Standard Single 25, Suite 29, Superior Double 29. Tallene står kun i `db/04_rooms_seed.sql`. | Hverken data, Opgave eller hotellets side oplyser fordelingen. Gruppen valgte denne regel. Værelsesnumre er løbenumre. |
| B-47 | T006 | Beslutning | LOFT Suite har kapacitet 4, selv om hotellet oplyser 5. **Afvigelse fra hotellets side.** FR-01 og databasen er ikke ændret. | Opgaven og FR-01 siger 1-4 personer pr. værelse. Summen af kapacitet bliver 592 gæster, hvor Opgaven og BR-05 siger ca. 428. |
| B-48 | T030, T035 | Beslutning | `GET /api/metrics/revenue/running` viser løbende indtjening fra nye bookinger og vises også på bookingsiden. | Årets indtjening ændrer sig ikke, når en demo-booking har indtjekning i et andet år. Her kan den ses med det samme. |
| B-49 | T063 | Beslutning | Ratings indtastes pr. booking i frontenden og via `POST /api/bookings/{id}/satisfaction`. **Ny task T063.** | De leverede data har ingen ratings, og de må ikke opfindes. Formularen viser også i demoen, at nøgletallet ændrer sig. Spec BR-08, FR-14 og AC-16.5 er rettet. |
| B-50 | T016 | Beslutning | MySQL-healthchecket venter op til 5 minutter ved første opstart. | Første opstart tog over 3 minutter på den stationære, og backenden startede derfor ikke med den korte frist. |
| B-51 | T064, T066 | Beslutning | `tableau-export` starter med `docker-compose up`, og profilen er fjernet. Plan og tasks er rettet. | Constitution V og Opgaven kræver én kommando, og FR-02 siger, at eksporten kører hvert 60. sekund. |
| B-52 | T065 | Beslutning | Nginx svarer 404 på `/nginx.conf`. | Hele `frontend/` er monteret som statiske filer, og konfigurationen skal ikke kunne hentes. |
| B-53 | T051 | Beslutning | Kolonnetyperne i `.hyper`-filen følger kolonnens navn, og alle 16 tabeller findes altid, også en tom `bookings`. | Før skiftede typerne efter data (fx `average_rating` fra tekst til tal), og `bookings` forsvandt uden bookinger. Det ville have ødelagt dashboardet. Testet med og uden booking: samme kolonner. |
| B-54 | T053 | Beslutning | Demoen kører med `.hyper` og en `.twb`: booking, luk Tableau, eksportér og åbn igen (valg A). Forløbet står i `docs/demo.md`. | Tableau låste filen med både Live og Extract på fanen Data Source, og opdateringen blev bekræftet efter lukning og genåbning. CSV blev fravalgt, fordi constitution IX kun tillader `.hyper`. Eksporten er også set gemme, mens Tableau stod med et ark åbent, men det er ikke testet, om F5 så henter tallene. |

## Åbne punkter og blokeringer

| Punkt | Hvad mangler | Blokerer | Status |
|---|---|---|---|
| Kapacitet mod 428 | Summen af kapacitet er 592, mens BR-05 siger ca. 428 (B-47). | Ingen | Til underviseren. |
| Historiske datoer | `stays` har ingen datoer, så belægning, RevPAR og ADR viser kun nye bookinger. | Historisk belægning i dashboardet | Kendt begrænsning (B-30). |
