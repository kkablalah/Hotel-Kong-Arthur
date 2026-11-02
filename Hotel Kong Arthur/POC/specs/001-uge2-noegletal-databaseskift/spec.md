# Feature Specification: Tillægsopgave uge 2: nøgletal i API og frontend samt databaseskift

**Feature Branch**: `Kena` (der er ikke oprettet en ny branch, mappen hedder `001-uge2-noegletal-databaseskift`)

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Tillægsopgave uge 2 til Hotel Kong Arthur-platformen, skrevet på dansk. Det eksisterende system (booking-CRUD, nøgletal, barsalg, Tableau-eksport, 3-lags backend i Node.js, frontend i ren HTML) ligger i specs/hotel-kong-arthur og i koden og er frosset som git-tag v1-mysql. Beskriv kun, hvad der er nyt eller ændret, og hvorfor, ikke teknologivalg. Hotellet har meldt tre nye krav. (1) Nøgletallene skal kunne læses direkte i API'et og ikke kun gennem Tableau: REST API'et skal stille de samme beregninger til rådighed, som Tableau-dashboardet viser: gæster pr. land, indtjening pr. værelsestype pr. sæson, indtjening pr. land, hvilke værelsestyper og lande der tjener mest, årets indtjening, belægningsgrad, kundetilfredshed, RevPAR og ADR samt Helene Christines salg (samlet, pr. drik og fordeling mellem cocktails og kaffe). Eksisterende endpoints genbruges, og kun det, der mangler, specificeres. (2) Frontend-prototypen skal vise disse beregninger for hotelledelsen, og de skal læses fra REST API'et. (3) Databasen skal udskiftes med en anden databasetype end MySQL uden tab af data og uden ændring i API'ets svar. Beslutning: db/01_schema.sql og db/02_data.sql må konverteres til den nye database, MySQL-originalerne bevares kun i git-tagget v1-mysql, og konverteringen skal verificeres mod kontroltallene. Ugyldige værdier (fx ID større end heltalsgrænsen, ugyldige datoer som 30. februar eller år 0000, nulbytes og for store priser) skal give 400 med det eksisterende fejlformat og ikke 500, og det er en lille ændring i forhold til version 1, som beskrives som krav. Bemærk under Assumptions, at databaseskiftet og dele af backend blev påbegyndt i kode, før denne specifikation var skrevet, og at kravene derfor skal beskrives uafhængigt af den nuværende kode og verificeres i Converge. Brugere: hotelledelsen, som vil se tallene i frontend, og hotellets IT, som vil hente tallene via API'et. Acceptkriterier skal være målbare, bl.a. at tallene er identiske før og efter skiftet (5379 nætter, 11234034,00 DKK i værelsesindtjening, 13448640,34 DKK i baromsætning, 52,8 % og 47,2 % af omsætningen, 34,5 % og 65,5 % af antal solgte), at frontend kun kalder REST API'et, at OpenAPI-kontrakten er opdateret, at alt starter fra ren opstart med docker-compose up, og at Tableau-eksporten stadig virker uændret. Uden for scope: login, ændringer i Tableau-dashboardet og nye bookingregler. Marker uklarheder som [NEEDS CLARIFICATION] i stedet for at gætte."

**Forhold til version 1**: Denne specifikation beskriver kun det nye og det ændrede. Alt andet i `specs/hotel-kong-arthur/spec.md` gælder stadig, også definitionerne BR-01 til BR-10. "Version 1" betyder systemet, som det var, da MySQL stadig var databasen.

**Hvorfor**: Hotelledelsen kan i dag kun se de fleste nøgletal gennem Tableau, og hotellet vil også kunne læse dem direkte i API'et og i frontenden. Hotellet har desuden krævet en anden database end MySQL, og API'ets svar må ikke ændre sig ved skiftet.

## Clarifications

### Session 2026-11-02

- Q: Skal hotelledelsen selv kunne vælge år og periode i frontenden? → A: Ja, men enkelt: ét årsvalg og ét periodevalg som dropdowns og ingen datovælger. Visningen starter med Tableaus perioder (FR-009).
- Q: Hvilket commit skal tagget `v1-mysql` pege på? → A: `ba5bd83` (FR-013).
- Q: Hvad dækker "uden tab af data"? → A: Kun de leverede startdata i `db/`. Bookinger og ratings fra version 1 flyttes ikke (FR-014).
- Q: Er grænserne under Assumptions godkendt? → A: Ja: højeste id 2147483647, højeste pris 9999999999,99 DKK, første opstart højst 5 minutter, og frontenden viser tallene inden for 5 sekunder.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nøgletal direkte fra API'et (Priority: P1)

Som hotellets IT ønsker jeg at kunne hente alle nøgletal direkte fra REST API'et, så vi kan bruge tallene i vores egne systemer uden at gå gennem Tableau.

**Why this priority**: Det er hotellets krav 1, og frontenden (User Story 3) bygger på det.

**Independent Test**: Start systemet fra ren opstart, kald hvert endpoint i tabellen "De 13 beregninger" alene med et HTTP-værktøj, og sammenlign svaret med kontroltallene i tabellen.

**Acceptance Scenarios**:

1. **Givet** et system fra ren opstart, **når** IT henter årets indtjening uden at angive et år, **så** er svaret 11234034.00 DKK fordelt på 1000 ophold.
2. **Givet** et system fra ren opstart, **når** IT henter Helene Christines samlede salg, **så** er svaret 13448640.34 DKK.
3. **Givet** et system fra ren opstart, **når** IT henter fordelingen mellem cocktails og kaffe, **så** er cocktails 52,8 % af omsætningen og 34,5 % af antal solgte, og kaffe er 47,2 % af omsætningen og 65,5 % af antal solgte.
4. **Givet** indtjening pr. værelsestype eller pr. land, **når** IT læser svaret, **så** er rækkerne sorteret faldende efter indtjening, og første række er den, der tjener mest.
5. **Givet** en af de 13 beregninger, **når** IT slår den op i OpenAPI-kontrakten, **så** står der, hvilket endpoint og hvilke parametre beregningen bruger.
6. **Givet** et nyt datagrundlag efter en oprettet booking, **når** IT henter et nøgletal og Tableau-eksporten har kørt, **så** er værdien den samme i API'et og i eksporten.

---

### User Story 2 - Databaseskift uden at nogen mærker det (Priority: P1)

Som hotellets IT ønsker jeg, at databasen udskiftes med en anden databasetype end MySQL uden tab af data og uden ændring i API'ets svar, så systemer, der bruger API'et, kan fortsætte uændret.

**Why this priority**: Det er hotellets krav 3, og det er den ændring, der kan ødelægge mest. Tallene i de andre historier skal være de samme før og efter.

**Independent Test**: Optag svarene fra referencesættet mod version 1. Start det nye system fra ren opstart, optag de samme svar, og sammenlign dem. Kontrollér også kontroltallene direkte i databasen.

**Acceptance Scenarios**:

1. **Givet** et system fra ren opstart, **når** kontrolberegningerne køres mod den nye database, **så** er resultatet 1000 ophold, 5379 nætter, 11234034,00 DKK i værelsesindtjening og 13448640,34 DKK i baromsætning.
2. **Givet** referencesættet, **når** svarene fra det nye system sammenlignes med svarene fra version 1, **så** er statuskoder, feltnavne, datatyper, værdier og rækkefølge identiske, bortset fra tidspunkterne `created_at` og `updated_at`.
3. **Givet** gæstenavne med særlige tegn, fx Müller, **når** de læses fra den nye database, **så** er de tegn for tegn de samme som i de leverede data.
4. **Givet** en booking, der overlapper en anden, for mange gæster eller et id, der ikke findes, **når** kaldet foretages, **så** er svaret det samme som i version 1 (409, 400 eller 404).
5. **Givet** en oprettet booking, **når** systemet genstartes uden at slette data, **så** findes bookingen stadig.
6. **Givet** et kørende system, **når** Tableau-eksporten er kørt, **så** indeholder filen de samme tabeller, kolonner og værdier som version 1 med samme data.
7. **Givet** en ren maskine med den dokumenterede `.env`-fil, **når** `docker-compose up` køres, **så** starter alle dele uden andre manuelle trin.

---

### User Story 3 - Nøgletal i frontenden til hotelledelsen (Priority: P2)

Som hotelledelse ønsker jeg at se nøgletallene i frontenden, så jeg kan følge hotellets og barens resultater uden at åbne Tableau.

**Why this priority**: Det er hotellets krav 2. Den kommer efter User Story 1, fordi den viser det, API'et leverer.

**Independent Test**: Åbn frontenden, og sammenlign hvert af de 13 viste tal med API'ets svar, mens browserens netværkslog viser, hvad der bliver kaldt.

**Acceptance Scenarios**:

1. **Givet** et system fra ren opstart, **når** hotelledelsen åbner nøgletalsvisningen, **så** vises alle 13 beregninger med årsvalget "Standard", årets indtjening er 11234034,00 DKK for 2025, Helene Christines salg er 13448640,34 DKK, og hvert tal viser, hvad det er, og hvilken periode det gælder.
2. **Givet** den åbne visning, **når** tallene sammenlignes med API'ets svar, **så** er de ens. Kun visningen af tallet må være anderledes, fx dansk tusindtalsseparator.
3. **Givet** den åbne visning, **når** netværksloggen læses, **så** kalder browseren kun REST API'et ud over frontendens egne filer.
4. **Givet** en periode uden bookinger eller ratings, **når** visningen åbnes, **så** står der, at der ikke er data, og et tomt tal vises ikke som 0.
5. **Givet** belægningsgrad, RevPAR og ADR, **når** de vises, **så** står der, at de kun bygger på nye bookinger, fordi historiske ophold ikke har datoer.
6. **Givet** en ny, rettet eller slettet booking eller en ny rating, **når** visningen opdateres, **så** indgår ændringen i tallene.
7. **Givet** at API'et ikke svarer, **når** visningen forsøger at hente tal, **så** vises en forståelig fejlbesked, og ingen gamle eller opfundne tal vises.
8. **Givet** en booking med indtjekning i 2028, **når** hotelledelsen vælger år 2028 og februar, **så** gælder belægningsgrad, kundetilfredshed, RevPAR og ADR 1.-29. februar 2028, og belægningsgraden regnes ud fra 6206 tilgængelige værelsesnætter (214 × 29).
9. **Givet** nøgletalsvisningen, **når** hotelledelsen vil afgrænse tallene, **så** sker det kun med de to dropdowns, og der er ingen datovælger.
10. **Givet** et valgt år uden barsalg, **når** visningen opdateres, **så** viser Helene Christines tal "ingen data" og ikke en systemfejl.

---

### User Story 4 - Ugyldige værdier afvises med 400 (Priority: P2)

Som hotellets IT ønsker jeg, at ugyldige værdier afvises med 400 i det eksisterende fejlformat, så jeg kan se forskel på fejl i vores input og fejl i systemet.

**Why this priority**: Det er en lille ændring i forhold til version 1. Den er nødvendig, fordi databaser reagerer forskelligt på ugyldige værdier, og et 500-svar ikke fortæller IT, at det er input, der er forkert.

**Independent Test**: Send hver værdi i tabellen "Ugyldige værdier" til de endpoints, der tager feltet, og kontrollér svar og data bagefter.

**Acceptance Scenarios**:

1. **Givet** et id over 2.147.483.647, **når** det sendes i stien, i en forespørgselsparameter eller i en booking, **så** er svaret 400 med fejlkoden `VALIDATION_ERROR`.
2. **Givet** datoen 2026-02-30 eller 0000-01-01, **når** den sendes som indtjekning, udtjekning eller periode, **så** er svaret 400 i samme format.
3. **Givet** et navn, en kommentar eller en forespørgselsparameter med en nulbyte, **når** kaldet foretages, **så** er svaret 400 i samme format.
4. **Givet** en pris over 9.999.999.999,99 DKK, **når** bookingen oprettes eller rettes, **så** er svaret 400 i samme format.
5. **Givet** et afvist kald, **når** data læses bagefter, **så** er intet ændret, og svaret indeholder hverken stack trace eller detaljer om databasen.
6. **Givet** en gyldig grænseværdi (id 2.147.483.647, 29. februar i et skudår, prisen 9.999.999.999,99 DKK), **når** kaldet foretages, **så** behandles den som enhver anden gyldig værdi, og et id, der ikke findes, giver 404.

---

### Edge Cases

- **Ren opstart uden bookinger og ratings**: Belægningsgrad og RevPAR er 0, ADR er tom, og kundetilfredshed har 0 ratings og et tomt gennemsnit. Frontenden skal vise det som "ingen data" og må ikke opfinde tal.
- **År uden data**: Årets indtjening og barsalget giver 404 for et år uden data, som i version 1. Frontenden viser det som "ingen data" og ikke som en systemfejl.
- **Periode i forkert rækkefølge**: `start_date` efter `end_date` giver stadig 400, som i version 1.
- **Land uden navn**: En booking uden land tæller stadig som "Ukendt" og indgår i totalerne (AC-08.4).
- **Flere på førstepladsen**: Hvis flere værelsestyper eller lande tjener nøjagtig lige meget, viser frontenden dem alle som dem, der tjener mest.
- **Ens sorteringsværdier ved sammenligning**: Rækker med nøjagtig samme sorteringsværdi må stå i en anden indbyrdes rækkefølge end i version 1. Alle andre rækkefølger skal være ens.
- **Sortering efter tekst**: Lister, der er sorteret efter navn, skal stå i samme rækkefølge som i version 1, også ved store og små bogstaver og danske tegn.
- **Id mellem de to grænser**: Et id mellem 2.147.483.648 og 4.294.967.295 var gyldigt i version 1 og gav 404, hvis det ikke fandtes. Nu giver det 400 (FR-021).
- **Pris, der først bliver for stor efter afrunding**: 9.999.999.999,995 DKK afvises med 400 og må ikke give 500.
- **Eksisterende datavolumen fra version 1**: En maskine kan stadig have en MySQL-volumen liggende. Det nye system må ikke fejle på grund af den og må ikke bruge den. Dens bookinger og ratings flyttes ikke (FR-014).
- **Valgt år med historiske ophold**: Vælges 2025 og "Hele året", viser årets indtjening (N6) også de historiske ophold, mens N1-N5 kun viser nye bookinger, fordi ophold ikke har datoer. FR-007 kræver, at forskellen står ved tallene.

## Requirements *(mandatory)*

### De 13 beregninger

Tabellen er kravet til API'et (krav 1) og til frontenden (krav 2). Beregningerne er taget fra hotellets krav og fra `tableau/dashboard/BYGGEVEJLEDNING.md`. Alle 13 har allerede et endpoint i kontrakten fra version 1, og **der mangler derfor ikke noget nyt endpoint**. Det, der mangler, er visningen i frontenden (FR-005 til FR-011) og reglerne for ugyldige værdier (FR-021 til FR-024).

| Nr. | Beregning | Endpoint, der genbruges | Ved ren opstart |
|---|---|---|---|
| N1 | Gæster pr. land | `GET /api/metrics/guests/countries` | 20 lande, 1000 ophold i alt |
| N2 | Indtjening pr. værelsestype pr. sæson | `GET /api/metrics/revenue?group_by=type_season` | I alt 11234034.00 DKK |
| N3 | Indtjening pr. land | `GET /api/metrics/revenue?group_by=country` | I alt 11234034.00 DKK |
| N4 | Værelsestypen, der tjener mest | `GET /api/metrics/revenue?group_by=type` | Første række |
| N5 | Landet, der tjener mest | `GET /api/metrics/revenue?group_by=country` | Første række |
| N6 | Årets indtjening | `GET /api/metrics/revenue/annual` | 11234034.00 DKK i 2025 |
| N7 | Belægningsgrad | `GET /api/metrics/occupancy` | 0 % |
| N8 | Kundetilfredshed | `GET /api/metrics/satisfaction` | 0 ratings, tomt gennemsnit |
| N9 | RevPAR | `GET /api/metrics/revpar` | 0.00 DKK |
| N10 | ADR | `GET /api/metrics/revpar` | Tom |
| N11 | Helene Christines samlede salg | `GET /api/cocktail/sales` | 13448640.34 DKK |
| N12 | Helene Christines salg pr. drik | `GET /api/cocktail/sales/products` | 30 drikke, i alt 13448640.34 DKK |
| N13 | Fordeling mellem cocktails og kaffe | `GET /api/cocktail/sales/distribution` | Cocktails 52,8 % og 34,5 %, kaffe 47,2 % og 65,5 % |

### Functional Requirements

**Nøgletal i API'et (krav 1)**

- **FR-001**: REST API'et SKAL stille alle 13 beregninger til rådighed med de definitioner, der gælder i version 1 (BR-01 til BR-09).
- **FR-002**: Beregningerne SKAL leveres af de eksisterende endpoints i tabellen. Der MÅ IKKE oprettes et nyt endpoint til en beregning, der allerede har et.
- **FR-003**: Værelsestypen og landet, der tjener mest (N4, N5), SKAL kunne aflæses af rækkefølgen, og kontrakten SKAL sige, at rækkerne er sorteret faldende.
- **FR-004**: API'et og Tableau-eksporten SKAL give samme værdier, fordi eksporten henter sine tal fra API'et og ikke har sine egne beregninger.

**Nøgletal i frontenden (krav 2)**

- **FR-005**: Frontenden SKAL have en visning til hotelledelsen med alle 13 beregninger.
- **FR-006**: Frontenden SKAL hente alle tal fra REST API'et. Den MÅ IKKE beregne nøgletal selv, tale med databasen eller læse Tableau-filen. Den må kun formatere tallene til visning.
- **FR-007**: Hvert tal SKAL vise, hvad det er, og hvilken periode eller hvilket år det gælder. Tal, der bygger på antagelser eller kun på nye bookinger, SKAL være markeret som det (BR-04, BR-06).
- **FR-008**: Frontenden SKAL vise manglende data og API-fejl som forståelige beskeder og MÅ IKKE vise et tomt tal som 0.
- **FR-009**: Frontenden SKAL have ét årsvalg og ét periodevalg som dropdowns og MÅ IKKE have en datovælger. Årsvalget SKAL have "Standard", som visningen starter med, samt de år, API'et har indtjening for, og indeværende år. Periodevalget SKAL have "Hele året" og de 12 måneder og gælder kun, når et år er valgt. Valgene virker som i tabellen "Årsvalg og periodevalg".
- **FR-010**: En ændring i bookinger eller ratings SKAL kunne ses i nøgletalsvisningen ved næste opdatering uden caching (C-01).
- **FR-011**: Frontendens eksisterende funktioner til bookinger og ratings SKAL virke, som de gør i version 1.

| Årsvalg og periodevalg | "Standard" (samme perioder som Tableau) | Valgt år og periode |
|---|---|---|
| N1-N5 | Alle data, også historiske ophold | Kun nye bookinger, der tjekker ind i perioden |
| N6 | 2025 (`HISTORIK_AAR`) | Det valgte år. Periodevalget gælder ikke |
| N7-N10 | Indeværende år | Den valgte periode |
| N11-N13 | 2025 (`HISTORIK_AAR`) | Det valgte år, og andre år end 2025 giver "ingen data". Periodevalget gælder ikke |

**Database (krav 3)**

- **FR-012**: Systemet SKAL køre på en anden databasetype end MySQL. Valget og begrundelsen hører til i `plan.md` (constitution IV).
- **FR-013**: `db/01_schema.sql` og `db/02_data.sql` MÅ konverteres til den nye database. Værdierne MÅ IKKE ændres, og MySQL-originalerne SKAL kun bevares i git-tagget `v1-mysql`, som peger på commit `ba5bd83`.
- **FR-014**: Skiftet SKAL ske uden tab af de leverede startdata i `db/`. Bookinger og ratings, der er oprettet i en kørende installation af version 1, flyttes ikke.
- **FR-015**: For gyldige kald og for de fejlsvar, der ikke er nævnt i FR-021, SKAL API'ets svar være uændret: samme stier, statuskoder, felter, datatyper, værdier, rækkefølge og formater (beløb som tekst med 2 decimaler, procenter med 1 decimal, datoer som `YYYY-MM-DD`, tidspunkter som `YYYY-MM-DD HH:MM:SS`).
- **FR-016**: Bookingreglerne fra version 1 SKAL virke uændret, også afvisning af dobbeltbooking med 409 (BR-10), kapacitet og sletning af ratings sammen med bookingen.
- **FR-017**: Skiftet af database MÅ IKKE kræve ændringer i præsentationslaget eller forretningslogiklaget (constitution IV).
- **FR-018**: Tableau-eksporten SKAL virke uændret: den henter kun fra REST API'et og skriver samme tabeller og kolonner med samme interval som i version 1.
- **FR-019**: Hele systemet SKAL kunne starte fra ren opstart med `docker-compose up`, startdata SKAL indlæses automatisk, og data SKAL bevares mellem genstarter (constitution V).
- **FR-020**: Kontrolberegningerne og dokumentationen SKAL passe til den nye database. Kontroltallene SKAL kunne genberegnes direkte i databasen, og ingen vejledning må beskrive MySQL som den database, systemet bruger.

**Ugyldige værdier (ændring i forhold til version 1)**

- **FR-021**: API'et SKAL afvise værdierne i tabellen "Ugyldige værdier" med 400 og det eksisterende fejlformat med koden `VALIDATION_ERROR`. De MÅ IKKE give 500.
- **FR-022**: Gyldige grænseværdier SKAL fortsat accepteres. Et id på eller under grænsen, der ikke findes, giver fortsat 404 eller den fejl, version 1 gav for det felt.
- **FR-023**: Et afvist kald MÅ IKKE ændre data, og svaret MÅ IKKE indeholde stack traces eller afsløre noget om databasen (NFR-10).
- **FR-024**: Afvisningerne i FR-021 er den eneste tilladte ændring i API'ets adfærd og er en undtagelse fra FR-015.

| Ugyldige værdier | Gælder for | Grænse |
|---|---|---|
| Id over heltalsgrænsen | Id i stien, `room_id` i forespørgslen, `room_id` og `country_id` i en booking | Højst 2.147.483.647 |
| Dato, der ikke findes | `check_in_date`, `check_out_date`, `start_date`, `end_date` | Fx 30. februar, 29. februar uden for skudår og år 0000 |
| Nulbyte i tekst | `first_name`, `family_name`, `comment` og alle forespørgselsparametre | Ingen nulbytes |
| For stor pris | `total_price` | Højst 9.999.999.999,99 DKK |

**Kontrakt**

- **FR-025**: OpenAPI-kontrakten SKAL opdateres med grænserne i tabellen ovenfor, 400-svar på alle berørte endpoints og et nyt versionsnummer. Den SKAL stemme overens med API'et i begge retninger og være tilgængelig i Swagger UI (constitution III).

### Krav fra version 1, som denne specifikation ændrer

| Version 1 | Ændring |
|---|---|
| Afsnit 3.1 "A MySQL database", NFR-03, AC-15.4 | Erstattes af FR-012 |
| Afsnit 3.1 "A browser-based frontend for booking management" | Udvides med FR-005 til FR-011 |
| FR-12 og AC-14.4 (fejlsvar) | Udvides med FR-021 til FR-025 |
| Bemærkningen i `plan.md` og `tasks.md` om, at `db/01` og `db/02` ikke må ændres | Erstattes af FR-013 |

### Uden for scope

- Login, roller og adgangskontrol.
- Ændringer i Tableau-dashboardet.
- Nye bookingregler.
- Nye nøgletal eller ændrede definitioner af de eksisterende.
- Datoer på historiske ophold eller andre ændringer af de leverede data.
- Flytning af bookinger og ratings fra en kørende installation af version 1.
- Datovælger i frontenden.

### Key Entities *(include if feature involves data)*

- **Nøgletal**: En af de 13 beregninger. Har en definition fra version 1, en periode eller et år og et endpoint. Gemmes ikke, men beregnes ved hvert kald.
- **Kontroltal**: De faste tal, der viser, at data er uændret: 1000 ophold, 5379 nætter, 11234034,00 DKK, 13448640,34 DKK og de fire procentandele.
- **Referencesæt**: En fast liste af API-kald med faste parametre og en fast rækkefølge af bookinger og ratings. Omfatter alle GET-endpoints og de eksisterende fejlsvar. Svarene optages mod version 1 og bruges til sammenligningen.
- **Startdata**: Lande, drikke, kategorier, værelsestyper, 1000 historiske ophold og 214 værelser. Ingen bookinger og ingen ratings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kontroltallene er identiske før og efter skiftet, uden tolerance: 1000 ophold, 5379 nætter, 11234034,00 DKK i værelsesindtjening, 13448640,34 DKK i baromsætning, cocktails 52,8 % og kaffe 47,2 % af omsætningen, cocktails 34,5 % og kaffe 65,5 % af antal solgte.
- **SC-002**: 100 % af kaldene i referencesættet giver samme svar som version 1, bortset fra `created_at` og `updated_at` og de tilladte ændringer i FR-021.
- **SC-003**: Antal rækker er uændret: 20 lande, 2 kategorier, 30 drikke, 8 værelsestyper, 1000 ophold og 214 værelser, og 0 tegn i gæstenavne er ændret i forhold til de leverede data.
- **SC-004**: IT kan hente 13 af 13 beregninger fra API'et, og hver af dem kan findes i OpenAPI-kontrakten.
- **SC-005**: Hotelledelsen kan se 13 af 13 beregninger i frontenden inden for 5 sekunder efter åbning og efter et nyt valg i en dropdown, og alle 13 har samme værdi som API'et.
- **SC-006**: Browserens netværkslog viser 0 kald til andet end frontendens egne filer og REST API'et.
- **SC-007**: 100 % af værdierne i tabellen "Ugyldige værdier" giver 400 med det eksisterende fejlformat på alle endpoints, der tager feltet, 0 giver 500, og antal rækker i databasen er uændret bagefter.
- **SC-008**: Kontrakttesten består i begge retninger, så alle endpoints i API'et står i kontrakten og omvendt, og Swagger UI viser de nye grænser.
- **SC-009**: Fra en maskine uden containere og datavolumener starter alle dele med `docker-compose up` inden for 5 minutter, uden andre manuelle trin end den dokumenterede `.env`-fil.
- **SC-010**: Tableau-eksporten skriver de samme 16 tabeller med de samme kolonner og værdier som version 1, bruger højst 30 sekunder (NFR-09), og dashboardet er ikke ændret.
- **SC-011**: Svartiderne fra version 1 holder: nøgletal højst 2 sekunder og booking-CRUD højst 500 millisekunder (NFR-09).
- **SC-012**: Converge-resultatet angiver for hvert krav FR-001 til FR-025 og SC-001 til SC-011, om det er opfyldt, og hvordan det er kontrolleret mod det kørende system.

## Assumptions

- **Kode før specifikation**: Databaseskiftet og dele af backenden blev påbegyndt i kode, før denne specifikation var skrevet (commit `4b5e03d`). Det afviger fra constitutionens "Specifikationen skal skrives før koden". Kravene er derfor beskrevet uafhængigt af den nuværende kode. Den kode beviser ikke, at et krav er opfyldt, og hvert krav skal verificeres i Converge.
- **Reference for "før"**: Sammenligningen kræver, at version 1 kan startes fra tagget `v1-mysql` (FR-013). Tagget blev oprettet lokalt på `ba5bd83` den 2026-11-02, og gruppen pusher det selv.
- **Dashboardet er ikke bygget endnu**: Sidste Converge-resultat (2026-11-01) angiver dashboardet som ikke bygget (T054, T055). "Det, Tableau-dashboardet viser" er derfor læst ud af `tableau/dashboard/BYGGEVEJLEDNING.md`, og krav til Tableau kontrolleres på eksportfilen.
- **Beregninger uden for de 13**: Løbende indtjening og belægning pr. måned findes i Tableau-vejledningen, men ikke i hotellets liste. Begge kan stadig hentes fra API'et, belægning pr. måned ved at angive en måned som periode. Frontenden viser fortsat løbende indtjening som i version 1. Den skal ikke have en samlet visning af belægning pr. måned, men én måned kan ses med periodevalget.
- **Historiske ophold har ingen datoer**: Belægningsgrad, RevPAR og ADR bygger derfor kun på nye bookinger, som i version 1 (BR-04). Kundetilfredshed bygger på ratings, og de leverede data har ingen. De fire tal er altså tomme eller 0, indtil der findes bookinger og ratings. 5379 nætter kan ikke aflæses i API'et, så det kontroltal kontrolleres direkte i databasen, hvilket constitutionen tillader.
- **Gæster pr. land**: N1 tæller ophold og ikke personer, som i version 1, fordi historiske ophold ikke har et antal gæster.
- **Barsalg og år**: Alt barsalg regnes som Helene Christines og hører til 2025 (`HISTORIK_AAR`), som i version 1 (BR-04, BR-06).
- **Heltalsgrænsen**: Godkendt den 2026-11-02: højeste id er 2.147.483.647, fordi det er den almindelige grænse for et heltal i databaser. Version 1 tillod id'er op til 4.294.967.295, men systemet har ingen id'er i nærheden af grænsen.
- **Prisgrænsen**: Godkendt den 2026-11-02: højeste pris er 9.999.999.999,99 DKK, som er det højeste, version 1 kan gemme, så ingen gyldig pris bliver afvist.
- **Betydningen af dropdowns**: "Standard" i årsvalget, månederne i periodevalget og tabellen "Årsvalg og periodevalg" er en tolkning af beslutningen om ét årsvalg og ét periodevalg, som gruppen bør bekræfte. "Standard" er nødvendig, fordi Tableaus perioder bruger forskellige år for forskellige tal, og ét valgt år derfor ikke kan vise dem alle.
- **Ren opstart**: Ren opstart betyder ingen containere og ingen datavolumener. Den dokumenterede kopi af `.env.example` til `.env` tæller ikke som et manuelt trin, fordi hemmeligheder ikke må ligge i git (constitution VI).
- **Tidsgrænser**: Godkendt den 2026-11-02: første opstart tager højst 5 minutter, og frontenden viser tallene inden for 5 sekunder. Hotellet har ikke selv angivet tal.
- **Constitution**: Constitution v2.0.0 antages at være godkendt af hele gruppen. Den lister godkendelsen som et åbent punkt.
