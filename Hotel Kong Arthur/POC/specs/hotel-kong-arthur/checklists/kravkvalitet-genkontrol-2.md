# Kravkvalitetstjekliste, genkontrol 2: Hotel Kong Arthur dataanalyse-platform

**Purpose**: Validerer kvaliteten af kravene (fuldstændighed, klarhed, konsistens, målbarhed, dækning) i constitution v1.1.0, spec.md (inkl. Clarifications), plan.md og tasks.md (62 opgaver). Tjeklisten tester kravene, ikke om koden virker.
**Created**: 2026-11-01
**Feature**: `specs/hotel-kong-arthur/spec.md` | **Plan**: `plan.md` | **Tasks**: `tasks.md` | **Constitution**: `.specify/memory/constitution.md`
**Tidligere tjeklister**: `kravkvalitet.md` (CHK001-CHK059) og `kravkvalitet-genkontrol.md` (CHK060-CHK174) er uændrede. Nummereringen fortsætter derfor fra CHK175.

**Review Ownership**: Tjeklisten tilhører anmelderen. Sæt kun `[x]`, når anmelderen har vurderet, at krav-kvalitetskriteriet er opfyldt. `[x]` betyder IKKE, at implementeringen er færdig. Alle punkter står åbne, og svaret efter hvert spørgsmål er et forslag til anmelderen.

**Markeringer**: `[Gap]` = kravet er delvist dækket. `[Uklart]` = kravet er tvetydigt eller uafklaret. `[Konflikt]` = kilderne strider mod hinanden. `[Mangler]` = kravet findes ikke. Punkter uden markering vurderes som tilstrækkelige.

**Sporing**: `tidl. CHK0xx` peger på samme emne i den forrige tjekliste. `Nyt` betyder, at emnet ikke var med dér.

## Udgangspunkt

**Implementeret kode**: Ingen. `backend/`, `frontend/`, `db/`, `openapi/`, `tableau/`, `docker-compose.yml`, `README.md`, `CONTRIBUTE.md` og `.env.example` findes ikke, 0 af 62 tasks er afkrydset, og POC-mappen er ikke et git-repository. Der er derfor ingen krav, der ser implementeret ud.

**Ændringer siden forrige tjekliste**: Ingen. Constitution, spec, plan og tasks blev sidst gemt 29/10, og den forrige tjekliste er fra 1/11. Et hul, der stod åbent dér, kan derfor ikke være lukket. Denne runde har læst kilderne og dataene igen og tilføjer de punkter, der er mærket `Nyt`.

**Kontrolkilder** (ikke nye krav): `E26 Tværfaglig Opgave Hotel Kong Arthur.pdf` (Opgave), `Tillægsspørgsmål_swa.pdf` (Tillæg) og de to datasæt herunder.

| Datasæt | Indhold | Findes IKKE |
|---|---|---|
| **Hoteldata**, 1000 rækker | `First Name`, `Family Name`, `Country` (20 lande, ingen tomme), `Room Type` (8 engelske navne, 103-138 rækker pr. type), `Days Rented` (1-10, i alt 5.379 nætter), `Season` (low/mid/high), `Price` (heltal, i alt 11.234.034) | Datoer, år, værelsesnummer, `capacity`, `guest_count`, antal værelser pr. type, e-mail, telefon, ratings |
| **Bardata**, 30 rækker | `Drink Name`, `Category` (20 Cocktail + 10 Coffee), `Price (DKK)`, `Units Sold` (i alt 179.958 enheder, 13.448.640,34 DKK) | Transaktioner, datoer, år, medarbejder |

**Datatjek, der påvirker kravene**:

- CSV og xlsx for hoteldata er ikke ens. CSV'en har et ødelagt tegn i navnet `Müller` i 54 rækker, og xlsx-filen har en ekstra række 1002 med `=SUM(E2:E1001)`.
- 5.379 nætter svarer til 6,9 % af ét års 78.110 værelsesnætter (214 × 365), og 3,4 % fordelt på to år.
- Hvis hele bardata henføres til Helene Christine, er cocktails 52,8 % af omsætningen, men kun 34,5 % af enhederne. Barens omsætning er større end hotellets.

---

## 1. Genkontrol af tidligere huller

| Emne | Entydigt beskrevet? | Task | Kan verificeres som skrevet? | Punkter |
|---|---|---|---|---|
| Live, 60 sekunder, ingen caching | Ja, afgrænsning af caching mangler | T028, T029, T051, T052, T055 | Delvist: API ja, eksport nej | CHK175-CHK178 |
| Kapacitet pr. booking | Ja som regel | T020, T023 | **Nej**, værdierne findes ikke | CHK179, CHK180 |
| Belægningsformel | Delvist, `end_date` mangler | T032, T037 | Delvist | CHK181-CHK183 |
| Afrundingstolerancer | Ja | T037, T047, T049, T055 | Delvist, T042 mangler | CHK184 |
| NFR'er (2 s, 500 ms, 30 s) | Ja som tal | T051, T053, T062 | Delvist, målemetode mangler | CHK185, CHK186 |
| Sikkerhedsafgrænsning | Ja | T057, T062 | Delvist | CHK187 |
| Dobbeltbooking | Ja for grænsetilfældet | T019, T021, T023 | Delvist, PUT mangler | CHK188-CHK190 |
| "Ukendt" land | Ja | T034, T037 | Delvist, T033 og testdata mangler | CHK191 |
| Datoformat ISO 8601 | Ja i plan og tasks, ikke i spec | T007, T018, T030 | Delvist | CHK192 |
| `db/` fra MySQL Workbench | Ja som procedure | T004-T006 | **Nej**, der er intet at eksportere | CHK193-CHK195 |
| Konfliktprocedure for `openapi.yaml` | Ja i tasks | T056 | Delvist, T056 kommer for sent | CHK196, CHK197 |
| Commits fra alle 5 | Ja | T060, T061 | **Nej**, før repository og navne findes | CHK198 |

### Live

- [ ] CHK175 - Er "live" entydigt defineret og dækket af tasks (næste GET uden caching, eksport hvert 60. sekund)? [Klarhed; spec FR-02, C-01, C-14, AC-05.4; plan afsnit 6; T028, T029, T051, T052] **Ja.** (tidl. CHK060)
- [ ] CHK176 - Er "eksporten kører hvert 60. sekund" foreneligt med, at `tableau-export` ligger bag profilen `extract`? [Konsistens; spec FR-02; plan afsnit 7; T052] **Nej.** Efter en almindelig `docker-compose up` kører der ingen eksport. (tidl. CHK061) [Konflikt]
- [ ] CHK177 - Er dashboardets forsinkelse angivet ens på tværs af filerne? [Konsistens; spec FR-02; plan afsnit 3.3] **Nej.** Spec kalder interval + reload for en øvre grænse, plan kalder samme tal "minimumsforsinkelse", og ingen medregner eksportens op til 30 sekunder. (tidl. CHK062) [Konflikt]
- [ ] CHK178 - Er "ingen caching" afgrænset (applikation, HTTP, Nginx), og stemmer planens "senere optimering (cache med TTL)" med C-01? [Klarhed; spec C-01; plan afsnit 6; T028] **Nej.** Afgrænsningen mangler, og TTL-sætningen står uden forbehold. (tidl. CHK063) [Uklart]

### Kapacitet pr. booking

- [ ] CHK179 - Er reglen `1 <= guest_count <= rooms.capacity` (kapacitet 1-4) entydig og dækket af tasks? [Klarhed; spec FR-01, AC-01.5; plan afsnit 4 og 8; T020, T023] **Ja**, som regel. (tidl. CHK064)
- [ ] CHK180 - Kan reglen verificeres med de leverede data? [Målbarhed; spec afsnit 6.1; plan afsnit 5; T020] **Nej.** Hverken `capacity` eller `guest_count` findes i dataene, se CHK210. (tidl. CHK065) [Mangler]

### Belægningsformel

- [ ] CHK181 - Er nattællingen i `[check_in, check_out)` og nævneren 214 × nætter entydig og ens overalt? [Konsistens; spec BR-01, C-05; plan afsnit 8; T032, T037] **Ja.** (tidl. CHK066)
- [ ] CHK182 - Er "antal nætter i perioden" entydigt, altså om `end_date` selv tæller med? [Klarhed; spec BR-01, BR-09; plan afsnit 6; T030, T035] **Nej.** Det ændrer belægning, RevPAR og kontrolforespørgslerne. (tidl. CHK067) [Uklart]
- [ ] CHK183 - Er ikke-tilgængelige værelser defineret, når nævneren altid er 214? [Fuldstændighed; spec FR-03, C-05, AC-06.4; plan afsnit 5 `rooms.is_active`] **Nej.** C-05 stiller spørgsmålet, men svaret nævner dem ikke. Det er uklart, om inaktive værelser kan bookes, og hvornår AC-06.4 ("no usable capacity data") kan indtræde. (tidl. CHK068) [Uklart]

### Afrunding og tolerance

- [ ] CHK184 - Er 0,01 DKK og 0,1 procentpoint anvendt ens, og er det fastlagt, hvor afrundingen sker? [Konsistens; spec BR-02, AC-13.5; plan afsnit 8; T033, T035, T037, T042, T047, T049, T055] **Delvist.** Værdierne er ens, men T042 nævner ingen tolerance, og antal decimaler for gennemsnitsrating mangler. T033 afrunder i SQL og T035 i servicen, så en sum af afrundede grupper kan afvige fra totalen. (tidl. CHK069, afrundingssted er nyt) [Gap]

### Målbare NFR'er

- [ ] CHK185 - Er 2 s, 500 ms og 30 s kvantificeret og dækket af tasks? [Målbarhed; spec NFR-09; plan afsnit 8; T051, T053, T062] **Delvist.** T062 henviser 30-sekunders-målingen til T053, men T053 nævner den ikke. (tidl. CHK070) [Gap]
- [ ] CHK186 - Er målemetoden defineret (størrelsen på "demo dataset", enkeltkald eller percentil, maskine)? [Målbarhed; spec NFR-09; tasks O-12, T062] **Nej.** O-12 angiver dækning, ikke datamængde. (tidl. CHK071) [Uklart]

### Sikkerhedsafgrænsning

- [ ] CHK187 - Er afgrænsningen entydig og dækket (ingen login som bevidst svaghed, parametriserede queries, ingen stack traces)? [Klarhed; spec afsnit 3.2, NFR-10; plan afsnit 1, 6 og 8; T057, T062] **Ja.** T062 tester dog injection i "gæstenavn", og det felt findes ikke i booking-kontrakten eller formularens beskrivelse (T018, T025). (tidl. CHK072) [Uklart]

### Dobbeltbooking

- [ ] CHK188 - Er overlap og samme-dags-grænsetilfældet entydigt defineret? [Klarhed; spec BR-10; plan afsnit 4 og 8; T019, T023] **Ja.** (tidl. CHK073)
- [ ] CHK189 - Er de øvrige scenarier dækket: ny `check_out` = eksisterende `check_in`, PUT mod sig selv, PUT → 409 og samtidige oprettelser? [Dækning; spec BR-10; plan afsnit 6; T021, T023] **Nej.** T023 tester kun den ene grænse og ingen PUT-konflikt, og samtidighed er hverken krævet eller fravalgt. (tidl. CHK074) [Gap]
- [ ] CHK190 - Er det krævet, at startdata selv overholder BR-10 og aldrig giver mere end 214 belagte værelser pr. nat? [Konsistens; spec BR-01, BR-10; T005, T006] **Nej.** Reglen er kun beskrevet for API'et, og 1000 historiske bookinger skal placeres på værelser og datoer. Nyt. [Gap]

### "Ukendt" land

- [ ] CHK191 - Er "Ukendt" navngivet, medregnet i totaler og dækket af tasks for både omsætning og gæster? [Klarhed; spec AC-08.4; plan afsnit 5 og 6; T033, T034, T037] **Delvist.** T034 har reglen, T033 har den ikke. Hoteldata har ingen tomme lande, og kilden til testrækker uden land er ikke beskrevet. (tidl. CHK075) [Gap]

### Datoformat

- [ ] CHK192 - Er ISO 8601 fastlagt for alle datoparametre og -felter? [Konsistens; plan afsnit 6; T007, T018, T030, T038, T043] **Delvist.** Plan og T007, T018 og T030 fastlægger det, men spec.md, T038 og T043 nævner det ikke. T007 kræver `YYYY-MM-DD` for alle datofelter, mens `created_at` og `updated_at` er tidspunkter uden angivet format. (tidl. CHK076, tidspunkter er nyt) [Gap]

### db/-produktionen

- [ ] CHK193 - Er fremgangsmåden i MySQL Workbench beskrevet trin for trin? [Klarhed; plan afsnit 5 og 7; T004, T005] **Ja**, som procedure. (tidl. CHK077)
- [ ] CHK194 - Findes det, proceduren eksporterer fra? [Konsistens; spec afsnit 1.2 og 6.3; plan afsnit 5; T004, T005] **Nej.** T004 forudsætter "leverede tabeller", men der er kun to flade filer. Ingen task beskriver import og normalisering til MySQL, og T005's færdig-betingelse (214 værelser og medarbejdere "stemmer med CSV") kan ikke opfyldes. (tidl. CHK078) [Konflikt]
- [ ] CHK195 - Er det fastlagt, hvilken hotelfil der er kilden, og hvordan dens fejl håndteres? [Fuldstændighed; spec afsnit 6.3; T005, T017] **Nej.** CSV'en har 54 ødelagte `Müller`, og xlsx-filen har en ekstra sumrække, som kan give en forkert række og et forkert rækkeantal i T005 og T017. Nyt. [Mangler]

### Konfliktprocedure for openapi.yaml

- [ ] CHK196 - Er proceduren entydig og tilgængelig for alle 5? [Klarhed; tasks "Procedure ved openapi/openapi.yaml"; T058] **Delvist.** Den er klar i tasks, men T058 (CONTRIBUTE.md) og plan afsnit 2 nævner den ikke. (tidl. CHK079) [Gap]
- [ ] CHK197 - Kan proceduren følges fra første kontraktopgave? [Konsistens; tasks Afhængigheder; T007, T018, T056] **Nej.** Den kræver kørsel af T056, som ligger i Fase 9 og tidligst laves efter Fase 2. (tidl. CHK080) [Konflikt]

### Commits fra alle 5

- [ ] CHK198 - Er kravet verificerbart? [Målbarhed; constitution "Git"; Opgave s. 5; T060, T061] **Delvist.** T061 dækker tjekket, men de 5 navne står ingen steder, T061 skriver i et Converge-resultat fra T060, der først kører til sidst, og der findes intet repository (CHK272). (tidl. CHK081) [Gap]

---

## 2. Åbne punkter

Status pr. 2026-11-01. Fristen 30/10 er overskredet, og ingen beslutning er registreret.

| ID | Ejer | Frist | Blokerede tasks angivet | Standardvalg | Konsistent med spec og plan? |
|---|---|---|---|---|---|
| O-1 | A (rolle) | 30/10, overskredet | Ja: T005, metrics-tests | Fordeling fra leveret data | **Nej**, dataene har ingen værelsesfordeling |
| O-7 | D (rolle) | 30/10, overskredet | Ja: T005, T006, T044, cocktail-tests | Markeret demodata | Ja med BR-06, men for snævert |
| O-8 | B (rolle) | 30/10, overskredet | Ja: T001, T007-T013, test-tasks | Express, ingen Knex, `node --test` | **Ja** |
| O-10 | E (rolle) | 30/10, overskredet | Ja: ingen task | Implementeres ikke | Delvist, plan bruger den stadig som mitigering |
| O-11 | Ingen | 30/10, overskredet | Kun indirekte: T052, T057 | Profil beholdes | **Nej**, står som afgjort, men kræver godkendelse |
| O-12 | C (rolle) | 30/10, overskredet | Ja: T006, metrics-tests, demo | Mindstekrav til dækning | Delvist, afviger fra T006 |
| O-13 | B (rolle) | 30/10, overskredet | Ja: T007, T013, T018, T030 | Engelsk | Delvist, `aar` er dansk, og plan afsnit 6 er forældet |
| O-14 | A (rolle) | 30/10, overskredet | Ja: T004-T006 | Eksporten er autoritativ | **Nej**, der findes intet at eksportere |
| O-15 | A + underviser | 30/10, derefter åben | Ja: T020, T023, AC-01.5 | "Spørg underviseren" | Ja med spec, men er ikke et brugbart standardvalg |

- [ ] CHK199 - Har hvert åbent punkt en navngiven ejer? [Fuldstændighed; tasks "Åbne punkter"] **Nej.** Der er kun rollebogstaver A-E uden personer, og Fase 1-opgaver blokeres af punkter, hvis ejere først får opgaver efter Fase 1. (tidl. CHK082) [Gap]
- [ ] CHK200 - Er det registreret, hvad der gælder nu, hvor fristen er overskredet? [Klarhed; tasks "Åbne punkter"] **Nej.** Reglen siger, at standardvalget gælder, men alle punkter står som åbne uden ny frist. (tidl. CHK083) [Uklart]
- [ ] CHK201 - O-1: Kan standardvalget lade sig gøre? [Konsistens; spec C-08, afsnit 6.1, BR-05; tasks O-1, T005] **Nej.** C-08 står som RESOLVED, men hoteldata viser fordelingen af bookinger (i alt 1000), ikke af 214 værelser. Spec afsnit 6.1 er cirkulær: mangler kilden, bruges kilden. T057 har heller ikke den README-note, O-1 kræver. (tidl. CHK084) [Konflikt]
- [ ] CHK202 - O-7: Dækker punktet det, der reelt mangler? [Fuldstændighed; spec C-13, afsnit 6.3; tasks O-7, T006] **Nej.** Det nævner medarbejderattribution, men ikke datoer, værelser og `guest_count` for de 1000 rækker. (tidl. CHK085) [Gap]
- [ ] CHK203 - O-8: Er standardvalget konsistent med plan og tasks? [Konsistens; plan afsnit 1, 8 og 9; T001] **Ja.** `dotenv` i T001 er ikke begrundet i planen, men ændrer ikke valget. (tidl. CHK086)
- [ ] CHK204 - O-10: Er standardvalget konsistent i hele planen? [Konsistens; plan afsnit 3.4, 9 og 10; tasks O-10] **Nej.** "Implementeres ikke" står ved siden af en risikotabel, der bruger reservemetoden som mitigering, se CHK259. (tidl. CHK087) [Konflikt]
- [ ] CHK205 - O-11: Er status entydig? [Konsistens; constitution V; Opgave s. 5; plan afsnit 7, 9 og 10; tasks O-11] **Nej.** Punktet står under "Afgjorte" med en åben godkendelsesfrist, plan kræver gruppegodkendelse, og både constitution V og Opgaven kræver én kommando. Modsat princip IX er der ingen undtagelse i constitution. (tidl. CHK088) [Konflikt]
- [ ] CHK206 - O-12: Stemmer mindstekravene med T006, og er datamængden fastlagt? [Konsistens; tasks O-12, T006; spec BR-01, NFR-09] **Nej.** T006 kræver "mindst 5 lande" for `cocktail_sales`, som ikke har noget land, og nævner ikke de 8 værelsestyper. Det er ikke afgjort, om 6,9 % eller 3,4 % belægning er acceptabelt, eller om der skal mere demodata til. (tidl. CHK089, datamængde er nyt) [Uklart]
- [ ] CHK207 - O-13: Følger alle henvisninger valget? [Konsistens; plan afsnit 6 og 9; tasks O-13] **Nej.** Plan afsnit 6 nævner stadig `GET /api/vaerelser` i T012 og O-9, mens det rigtige er `GET /api/rooms` i T013 og O-13. Parameteren `aar` er dansk i et ellers engelsk API. (tidl. CHK090) [Konflikt]
- [ ] CHK208 - O-14: Er konsekvensen for senere tasks beskrevet, hvis schemaet afviger? [Dækning; plan afsnit 5; tasks O-14] **Nej.** Plan afsnit 5 bygger på "T004-schemaet", og T004 bygger på plan afsnit 5. T009, T019, T032-T034 og T044 afhænger af resultatet uden at være nævnt. (tidl. CHK091) [Uklart]
- [ ] CHK209 - O-15: Er det klart, at `rooms.capacity` blokerer T020 og T023? [Klarhed; tasks O-15, T020] **Ja.** (tidl. CHK092)
- [ ] CHK210 - O-15: Er det klart, hvad der sker, når dataene ikke indeholder værdierne? [Fuldstændighed; spec FR-01, afsnit 6.1; plan afsnit 5; tasks O-15] **Nej.** Reglen er "spørg underviseren, opfind ikke værdier", og den situation er indtrådt nu. Antagelsen "feltet findes" er forkert, der er ingen svarfrist og ingen adfærd for værelser uden værdi, og T006 tilføjer ikke `rooms.capacity`. (tidl. CHK093) [Mangler]
- [ ] CHK211 - O-15: Er hele blokeringskæden angivet? [Dækning; tasks Afhængigheder, O-15] **Nej.** T020 → T021 → T022 → T024-T027 → T028 betyder, at en manglende afklaring rammer al booking-CRUD og live-demoen. T006 (`guest_count` på eksisterende bookinger) afhænger også af den. (tidl. CHK094) [Gap]
- [ ] CHK212 - Er kapacitet defineret pr. værelse eller pr. type, og skal summen passe med ca. 428 gæster? [Klarhed; spec afsnit 6.1, BR-05; Opgave s. 2] **Nej.** Spec siger pr. værelse, Opgaven nævner "størrelse og kategori", og BR-05 kobler ikke de 428 til summen af `rooms.capacity`. (tidl. CHK095, summen er ny) [Uklart]
- [ ] CHK213 - Er alle uafklarede C-punkter ført over til åbne punkter? [Dækning; spec afsnit 10 C-09, C-13; plan "Næste skridt"] **Nej.** C-09 er åben uden O-punkt, og plan "Næste skridt" nævner hverken O-1, O-7, O-12 eller O-14. (tidl. CHK096) [Gap]
- [ ] CHK214 - Peger henvisningerne til O-punkter og beslutninger på det rigtige? [Konsistens; plan afsnit 5; tasks Prerequisites, Fase 8, Afhængigheder] **Nej.** Plan afsnit 5 kalder attribution O-8 (skal være O-7), tasks afhænger af "beslutningen i T048" (O-3 er afgjort), Fase 8 kalder O-9 åbent, og "Prerequisites" nævner BR-01-08 (spec har BR-01-10). (tidl. CHK097) [Konflikt]

---

## 3. Nøgletal

### Datagrundlag og periode

- [ ] CHK215 - Er det fastlagt, hvordan historiske bookinger får datoer? [Fuldstændighed; spec afsnit 6.3, BR-01, BR-04; plan afsnit 5; T005, T006] **Nej.** `check_in_date` og `check_out_date` er obligatoriske i modellen og findes ikke i dataene. Belægning, år, perioder, RevPAR og ADR afhænger af det. (tidl. CHK098) [Mangler]
- [ ] CHK216 - Er sæsonernes datoer entydige og dækker de hele året uden overlap? [Klarhed; spec BR-03, C-02, C-03; plan afsnit 5; T031] **Ja**, og de er ens i alle tre filer. (tidl. CHK100)
- [ ] CHK217 - Er det fastlagt, hvad der gælder for historiske rækker: kolonnen `Season` eller BR-03? [Konsistens; spec BR-03; T031] **Nej.** Kolonnen er ikke nævnt, og tildelte datoer kan modsige den. (tidl. CHK099) [Uklart]
- [ ] CHK218 - Er omsætning defineret for bookinger, der krydser sæson, år eller rapporteringsperiode? [Fuldstændighed; spec FR-04, AC-07.5, BR-02, BR-09] **Nej.** AC-07.5 henviser til en afklaring, der ikke findes, selv om FR-04 kræver, at det dokumenteres før implementering. ADR kan blande hel bookingværdi med nætter i perioden. (tidl. CHK101) [Mangler]
- [ ] CHK219 - Er "belægning over tid" specificeret med en tidsopløsning? [Klarhed; spec FR-03; Opgave s. 5; plan afsnit 6; T054] **Nej.** Endpointet giver én værdi pr. periode, og ingen opløsning er nævnt. (tidl. CHK117) [Uklart]

### Indtjening

- [ ] CHK220 - Er "indtjening pr. værelsestype pr. sæson" understøttet som kombination? [Konsistens; Opgave s. 4; spec US-07; plan afsnit 6 `group_by`; T030, T033] **Nej.** `group_by` tager én værdi, og T033 grupperer separat, men tasks Fase 4 kalder det "pr. værelsestype pr. sæson". (tidl. CHK102) [Konflikt]
- [ ] CHK221 - Er lagplaceringen af sæson og nattælling konsistent med princip I? [Konsistens; constitution I; plan afsnit 4 og 5; T031, T032, T033] **Nej.** Sæson er "beregning i business-laget", men T033 kræver SQL-gruppering pr. sæson. T032 lægger nattællingen i SQL, og T033 lægger standardåret i repository. (tidl. CHK104) [Konflikt]
- [ ] CHK222 - Er indtjening pr. land entydigt placeret? [Konsistens; spec AC-08.1; T033, T034] **Nej.** Både `revenueRepository` og `guestsRepository` skal beregne den. (tidl. CHK103) [Uklart]
- [ ] CHK223 - Er "hvilke værelser og lande tjener mest" entydigt besvaret? [Klarhed; Opgave s. 4; spec mål 5, AC-07.4, AC-08.3; plan afsnit 6; T033] **Delvist.** Faldende sortering besvarer det for lande og værelsestyper. At "værelser" betyder værelsestyper er kun implicit, og T030 nævner ikke sorteringen, som plan placerer i kontrakten. (tidl. CHK105) [Gap]
- [ ] CHK224 - Er der en kobling mellem værelsestypenavnene i spec og i dataene? [Konsistens; spec afsnit 6.1; hoteldata] **Nej.** Fx "Standard Enkeltværelse" mod `Standard Single`. (tidl. CHK106) [Gap]
- [ ] CHK225 - Er årets indtjening og `?aar=` entydigt? [Klarhed; spec FR-05, BR-04, C-07; T030, T033, T035] **Delvist.** Parameteren er entydig, men "seneste år med komplette data" er udefineret. Dataene har intet år, og det er uklart, hvordan nye bookinger påvirker valget, og om hotel og bar har hver sin standard. (tidl. CHK107) [Uklart]
- [ ] CHK226 - Hedder årsparameteren det samme overalt? [Konsistens; spec BR-04; plan afsnit 6; T030, T043] **Nej.** Plan bruger `year` på cocktail-endpoints, mens spec og tasks bruger `aar`. Plan angiver heller ikke standardår for cocktail. (tidl. CHK108) [Konflikt]
- [ ] CHK227 - Er svaret ved manglende data entydigt? [Klarhed; spec AC-06.4, AC-09.4, AC-11.4, AC-16.4, BR-08; plan afsnit 6; T035, T039] **Nej.** AC-09.4 og AC-16.4 tillader "besked eller nul", plan giver 404 for annual, men 200/400 for satisfaction, BR-08 kræver et tomt resultat, og AC-11.4 henviser til regler, der ikke findes. (tidl. CHK109) [Uklart]
- [ ] CHK228 - Er det fastlagt, om `Price` er `total_price` inkl. skatter og gebyrer, og hvor `room_types.base_price` kommer fra? [Klarhed; spec BR-02, C-06; plan afsnit 5] **Nej.** Koblingen til `Price` er kun implicit, og `base_price` findes ikke i dataene. (tidl. CHK110, `base_price` er nyt) [Gap]

### Gæster pr. land

- [ ] CHK229 - Er "gæster pr. land" entydigt og har det acceptkriterier? [Målbarhed; spec FR-06, AC-13.1; T034] **Nej.** Det er ikke fastlagt, om der tælles unikke gæster, bookinger eller summen af `guest_count`, og US-08 dækker kun omsætning. Hoteldata har 369 forskellige navne på 1000 rækker, og en regel for, hvornår to rækker er samme gæst, mangler. (tidl. CHK111) [Uklart]
- [ ] CHK230 - Stemmer landeformatet med dataene? [Konsistens; plan afsnit 5 "ISO-kode (FR-06)"; spec FR-06; hoteldata] **Nej.** FR-06 nævner ingen ISO-kode, og dataene har fulde landenavne. (tidl. CHK112) [Konflikt]

### Kundetilfredshed

- [ ] CHK231 - Er kundetilfredshed (`customer_satisfaction`) entydigt defineret? [Klarhed; spec FR-14, BR-08, AC-16; plan afsnit 5; T006, T039-T042] **Delvist.** Formel, skala, eksklusion og demodata er på plads. Det er ikke defineret, hvilken dato perioden måles på. AC-16.4's "defined zero" passer dårligt med en skala på 1-5 og BR-08's "defined empty". (tidl. CHK113) [Uklart]
- [ ] CHK232 - Er sletning af en booking med rating defineret? [Dækning; spec AC-04, BR-08; plan afsnit 5; T006, T019, T027] **Nej.** Fremmednøglen og DELETE → 204 er ikke afstemt, og sletning er ikke afgjort som fysisk eller logisk. (tidl. CHK114) [Gap]
- [ ] CHK233 - Er det afklaret, om nye ratings skal kunne komme ind under drift? [Fuldstændighed; spec FR-02, FR-14, afsnit 6.3; plan afsnit 6] **Nej.** Der er intet endpoint til ratings, så nøgletallet kan kun bygge på startdata. Det er hverken krævet eller fravalgt. Nyt. [Uklart]

### RevPAR og ADR

- [ ] CHK234 - Er RevPAR og ADR entydigt defineret med formål og periode? [Klarhed; spec FR-10, BR-09; T048, T049] **Delvist.** Formlerne er entydige. ADR ved 0 belagte nætter er ikke defineret, og FR-10 har ingen user story eller AC ud over AC-13.1. (tidl. CHK115) [Gap]
- [ ] CHK235 - Har RevPAR og ADR endpoints, og når de frem til dashboardet? [Konsistens; plan afsnit 4, 6 og 8; T049, T051, T054] **Nej.** Plan afsnit 4, 6 og 8 nævner dem ikke, T049 navngiver ingen URL, og T051's endpoint-liste mangler dem, selv om T054 skal vise dem. (tidl. CHK116) [Mangler]

---

## 4. Cocktailbar

- [ ] CHK236 - Er Helene Christines samlede salg entydigt defineret? [Klarhed; spec FR-07, BR-06, C-10, AC-10; T044, T045] **Delvist.** Formlen er entydig, men det er ikke angivet, hvordan backenden identificerer hende. (tidl. CHK118) [Uklart]
- [ ] CHK237 - Er datakilden dækket? [Konsistens; spec C-09, afsnit 6.2; plan afsnit 5; T004-T006; bardata] **Nej.** T004 kalder `cocktail_sales` og `employees` for leverede tabeller, men bardata er en aggregeret menu uden transaktioner, år og medarbejder. C-09 står stadig åben. (tidl. CHK119) [Konflikt]
- [ ] CHK238 - Er det fastlagt, hvordan aggregerede tal bliver til salg pr. år og medarbejder? [Fuldstændighed; spec BR-06, afsnit 6.3; Opgave s. 3; T006] **Nej.** Opgaven siger, at Helene laver alle 30 drikke, men det er ikke afgjort, om hele filen er hendes salg, hvilket år den gælder, eller om simuleret salg skal stemme med `Units Sold`. (tidl. CHK120) [Uklart]
- [ ] CHK239 - Er omsætning pr. drink entydig? [Klarhed; spec FR-08, AC-11; plan afsnit 6; T044, T045] **Delvist.** Rangeringen er entydig, men det er uklart, om tallet gælder alle medarbejdere eller kun Helene, og endpointet kræver datoer, som bardata ikke har. (tidl. CHK121) [Uklart]
- [ ] CHK240 - Er begge fordelinger (omsætning og antal) defineret med nævner og decimaler? [Målbarhed; spec FR-09, BR-07, AC-12; plan afsnit 6; T043-T047] **Ja.** T044 punkt 3 nævner dog ikke, at fordelingen kun gælder Helene. (tidl. CHK122) [Gap]
- [ ] CHK241 - Er 20 cocktails og 10 kaffetyper dækket? [Dækning; spec afsnit 6.2; plan afsnit 5; T005, T006; bardata] **Delvist.** Dataene stemmer (20 + 10), men T005 og T006 tjekker kun "30 produkter". Fire priser er gemt med støj som `91.40000000000001`, og konvertering til DECIMAL er ikke nævnt. (tidl. CHK123) [Gap]
- [ ] CHK242 - Er demodata reelt til at skelne fra historiske data? [Målbarhed; spec afsnit 6.3, BR-06, BR-08; T006, T054, T057] **Nej.** T006 tillader "kolonne eller kommentar", og en kommentar kan ikke ses i API eller dashboard. BR-06 kræver dokumentation af simuleringen, men ingen task leverer den. (tidl. CHK124) [Uklart]
- [ ] CHK243 - Er det beskrevet, hvordan salg tilføjes eller rettes, så AC-10.3 kan verificeres? [Målbarhed; spec AC-10.3, FR-02; plan afsnit 6; T043-T047] **Nej.** AC-10.3 forudsætter ændrede salgsrækker, men alle cocktail-endpoints er GET, og "live" er kun beskrevet for bookinger. Nyt. [Gap]

---

## 5. API og kontrakt

- [ ] CHK244 - Er endpoints, URL-struktur, metoder og statuskoder specificeret? [Fuldstændighed; constitution II; plan afsnit 6; T007, T018, T030, T038, T043] **Delvist.** Bookings, metrics, cocktail og `/health` er med. `GET /api/rooms` står ikke i planens tabeller, RevPAR/ADR mangler (CHK235), og filternavne og sideinddeling for `GET /api/bookings` er ikke angivet. (tidl. CHK125, CHK133) [Gap]
- [ ] CHK245 - Kan en booking oprettes med de endpoints, der er specificeret? [Fuldstændighed; spec FR-01; plan afsnit 5 og 6; T019, T025] **Nej.** En booking kræver `guest_id`, men der er intet endpoint til at finde eller oprette en gæst. Hvor en ny gæsts land kommer fra, er heller ikke beskrevet. (tidl. CHK126) [Mangler]
- [ ] CHK246 - Er det fastlagt, hvor `total_price` på en ny booking kommer fra? [Klarhed; spec BR-02; plan afsnit 5; T020, T025] **Nej.** Feltet indtastes i formularen uden regel eller kobling til priser pr. nat og sæson. (tidl. CHK127) [Uklart]
- [ ] CHK247 - Er 400, 404 og 409 entydige for bookings? [Klarhed; spec BR-10, AC-01.5, AC-02.3; plan afsnit 6 og 8; T022, T023] **Delvist.** Hovedtilfældene er entydige. Statuskoden for en ikke-eksisterende `room_id` eller `guest_id` er ikke angivet. (tidl. CHK128) [Gap]
- [ ] CHK248 - Er svarformatet for nøgletal beskrevet, så perioden kan identificeres? [Fuldstændighed; spec FR-05, FR-07, FR-14, AC-14.2; plan afsnit 6; T030, T038, T043] **Nej.** Parametre og statuskoder er angivet, men ingen felter. T030 og T043 siger kun "med skemaer" eller nævner kun andelene. Nyt. [Gap]
- [ ] CHK249 - Er fejlformatet uden stack traces specificeret for alle fejl? [Fuldstændighed; spec NFR-10; plan afsnit 6; T011, T056, T062] **Delvist.** 400/404/409/500 er dækket. Det er ikke beskrevet, om validatorens egne fejl oversættes til formatet, eller hvad der gælder ved ugyldig JSON, ukendt route og forkert metode. (tidl. CHK129) [Gap]
- [ ] CHK250 - Er metoden til at holde kontrakt og kode ens beskrevet og dækket af en task? [Konsistens; constitution III; plan afsnit 2 og 8; T012, T056] **Ja.** "I produktion kan den køre i warn-mode" står dog mod T012 ("afvises"), så adfærden ved demoen er uafklaret. (tidl. CHK130) [Uklart]
- [ ] CHK251 - Er "samme commit" foreneligt med contract-first og "commit efter hver opgave"? [Konsistens; constitution III; plan afsnit 2; tasks Notes; T018, T022, T056] **Nej.** Kontrakten ligger i en task før koden, og med T056 aktiv fejler testen, så snart et dokumenteret endpoint ikke har en route. (tidl. CHK131) [Konflikt]
- [ ] CHK252 - Er Swagger UI's "Try it out" dækket? [Konsistens; plan afsnit 1, 2 og 9; tasks Fase 2 Checkpoint] **Nej.** Planen fjerner CORS med begrundelse i frontendens proxy, men Swagger UI kører på 8080 og API'et på 8000, og Fase 2 skal kunne demonstreres i Swagger UI. (tidl. CHK132) [Gap]
- [ ] CHK253 - Er hotellets eget bookingsystem dækket som kunde til kontrakten? [Dækning; constitution VII; Opgave s. 5; spec afsnit 3.2; plan afsnit 1] **Nej**, kun som bemærkning uden AC eller task, og spec afsnit 3.2 udelukker selve integrationen. (tidl. CHK134) [Uklart]

---

## 6. Tableau

- [ ] CHK254 - Er Python-scriptet med Hyper API beskrevet ens? [Konsistens; constitution IX; plan afsnit 1, 3.1 og 3.2; T050, T051; tasks Notes] **Ja.** Eget værktøj, egen container, kun REST og ingen forretningslogik. (tidl. CHK135)
- [ ] CHK255 - Er status på undtagelsen til princip IX ens på tværs af filerne? [Konsistens; constitution IX og Sync Impact Report; plan sidehoved, afsnit 3.2, 9 og 10; tasks O-9] **Nej.** Plan afsnit 3.2 siger "gruppebeslutning påkrævet" med alternativer, afsnit 9 og 10 siger besluttet. Plans sidehoved og Sync Impact Report står på v1.0.0, mens constitution er v1.1.0. (tidl. CHK136) [Konflikt]
- [ ] CHK256 - Er den monterede mappe ens beskrevet? [Konsistens; plan afsnit 3.1 og 7; T003, T016, T051, T052] **Nej.** Plan og T052 bruger host-mount `./extracts`, T016 opretter en navngivet volume `extracts`, og `EXTRACT_OUTPUT_PATH` mangler i plan afsnit 7 og T003. (tidl. CHK137) [Konflikt]
- [ ] CHK257 - Er intervallet og kørselsformerne entydige? [Klarhed; spec C-14; plan afsnit 3.1; T051, T052, T053] **Delvist.** 60 sekunder er ens overalt. Plan beskriver også én manuel kørsel, men T051 har kun løkken, så det er uklart, om `docker-compose run tableau-export` i T053 stopper. (tidl. CHK138) [Uklart]
- [ ] CHK258 - Er begrænsningerne i forhold til live dækket? [Fuldstændighed; spec FR-02, AC-13.6; plan afsnit 3.3 og 9; T054, T055, T057] **Delvist.** README er dækket, men planens risikotabel kræver også tekst i selve dashboardet, og det har T054 ikke med. (tidl. CHK139) [Gap]
- [ ] CHK259 - Er reservemetoden (direkte MySQL, kun med gruppens godkendelse) konsistent med constitution? [Konsistens; constitution VIII og Governance; plan afsnit 3.4 og 10; tasks O-10] **Nej.** Plan og tasks er enige om betingelsen, men constitution VIII har ingen undtagelse, og forfatningen går forud ved konflikter. Read-only-brugeren og adgang til port 3306 har ingen task. (tidl. CHK140) [Konflikt]
- [ ] CHK260 - Er datakontrakten mellem API og Tableau defineret? [Fuldstændighed; spec afsnit 9 punkt 7, FR-11, AC-13.3; constitution VIII; T051, T054] **Nej.** Tabeller i `.hyper`-filen, perioder og tidsopløsning er ikke angivet. Det er uklart, hvordan filtre på periode kan virke på færdigberegnede tal, uden at Tableau selv beregner. (tidl. CHK141) [Mangler]
- [ ] CHK261 - Er scriptets fejladfærd og en åben fil i Tableau dækket? [Dækning; plan afsnit 3.1 og 9; T051, T053] **Nej.** Backend nede og manglende endpoint er ikke beskrevet, den tidlige test (T053) kører, før alle endpoints findes, og omdøbning af en fil, Tableau har åben, er kun vurderet som lav risiko uden en krævet test. (tidl. CHK142, CHK143) [Gap]
- [ ] CHK262 - Er Tableau-licensen afklaret? [Antagelse; plan afsnit 9 "Kritiske afhængigheder"; T054] **Nej.** Licens og Tableau Public er nævnt uden ejer eller verifikation af, at T054's `.twbx` kan laves. (tidl. CHK144) [Uklart]

---

## 7. Docker og drift

- [ ] CHK263 - Er services, images og porte beskrevet og dækket af tasks? [Fuldstændighed; plan afsnit 7; T014-T016, T052] **Ja.** Undtagelsen er `tableau-export`, se CHK205. (tidl. CHK145)
- [ ] CHK264 - Er start-rækkefølge og healthchecks entydige? [Klarhed; constitution V; spec AC-15.4; plan afsnit 7; T016] **Delvist.** Rækkefølgen er entydig. Det er ikke defineret, om "sund" betyder, at 01-03-filerne er indlæst, om `/health` tjekker databasen, eller hvad frontenden viser, når backenden er nede. (tidl. CHK146) [Uklart]
- [ ] CHK265 - Er volumes og automatisk indlæsning ved første opstart beskrevet? [Fuldstændighed; constitution IV og V; plan afsnit 7; T002, T016] **Ja.** T002's `mysql_data/` i `.gitignore` passer dog ikke til en navngiven volume. (tidl. CHK147) [Gap]
- [ ] CHK266 - Er `.env` og `.env.example` dækket, også fra en frisk klon? [Fuldstændighed; constitution VI; spec AC-15.5; plan afsnit 7; T002, T003, T017, T057] **Delvist.** Der er intet trin, der opretter `.env` efter kloning, T003 henviser til værdier, plan ikke angiver, og koblingen fra `DB_*` til MySQL-containerens variabler er ikke beskrevet. (tidl. CHK148) [Gap]
- [ ] CHK267 - Er det klart beskrevet, hvad der sker med data ved `docker-compose down` og `down -v`? [Klarhed; Tillæg spm. 8; plan afsnit 7; T017, T057] **Nej.** Plan siger kun "mellem genstarter" og "ved første opstart", og `down -v` står kun som kommando i T017. Tab af nye bookinger, og at `db/`-ændringer ikke indlæses i en eksisterende volume, er ikke beskrevet. (tidl. CHK149) [Mangler]
- [ ] CHK268 - Er projektstrukturen ens? [Konsistens; constitution "Project Structure"; plan afsnit 3 og 8; T001, T059] **Nej.** `tableau/`, `extracts/` og `docs/` findes i plan og tasks, men ikke i constitution. (tidl. CHK150) [Gap]

---

## 8. Afleveringskrav

- [ ] CHK269 - Er spec-artefakterne navngivet som krav og klar til aflevering? [Fuldstændighed; Opgave s. 5; spec NFR-08] **Delvist.** NFR-08 siger kun "required artifacts". Sync Impact Report er forældet og mærket "Fjern før commit", spec.md starter med en løs linje "Specify:", og `Specify.md.txt` er en identisk kopi. (tidl. CHK151) [Gap]
- [ ] CHK270 - Har alle user stories format og acceptkriterier (INVEST)? [Målbarhed; constitution "User Stories"; spec afsnit 5] **Delvist.** US-01 til US-16 har acceptkriterier. Testbarheden svækkes af AC-07.5, AC-09.4, AC-11.4 og AC-16.4, stories er på engelsk over for constitutions danske format, FR-06 og FR-10 mangler egne stories, og US-13 er meget bred. (tidl. CHK152) [Gap]
- [ ] CHK271 - Er README med arkitekturdiagram, CONTRIBUTE.md og Swagger UI i egen container dækket? [Dækning; constitution III og "Dokumentation"; plan afsnit 2 og 7; T016, T057, T058] **Ja.** T029, T048 og T055 skriver dog i `README.md`, før T057 opretter den. (tidl. CHK153) [Gap]
- [ ] CHK272 - Er GitHub-repository og commits fra alle 5 dækket af krav og tasks? [Dækning; Opgave s. 5; constitution "Git"; spec NFR-08; T001, T061; plan sidehoved] **Nej.** Ingen task opretter repository eller sætter navne for commits, T061 kan først køre bagefter (CHK198), review før merge har ingen task, og planen står på branch `main` over for kravet om feature-branches. Datafilerne ligger uden for POC-mappen. (tidl. CHK154, branch og datafiler er nyt) [Mangler]
- [ ] CHK273 - Er resultatet af det sidste Converge-tjek (implementeret og mangler) dækket? [Dækning; Opgave s. 4-5; spec afsnit 11; T060] **Delvist.** T060 dækker tjekket, men fil og format er ikke angivet. Opgaven beskriver gentagelse af implement og converge, mens T060 er ét tjek til sidst. (tidl. CHK155) [Gap]
- [ ] CHK274 - Er kravet om, at alle 5 kan forklare koden, verificerbart? [Målbarhed; constitution "Ejerskab og AI"; spec afsnit 11 punkt 8; Opgave s. 2] **Nej.** Der er ingen task eller kriterium for det. (tidl. CHK156) [Gap]

---

## 9. Præsentation

- [ ] CHK275 - Er der krav eller tasks, der forbereder den 10 minutters præsentation? [Dækning; Opgave s. 6; spec afsnit 12] **Nej.** Spec har kun "can demonstrate and explain". Dato, format (10 + 10 minutter) og rollen som reviewgruppe for en anden gruppe står ingen steder. (tidl. CHK157) [Mangler]
- [ ] CHK276 - Er live-demoen af en booking fra browser til MySQL til Tableau beskrevet? [Dækning; spec AC-05.3, AC-13.6; plan afsnit 8 "Systemtest"; T053, T055] **Nej.** Delene findes, men der er ingen task, intet forløb og ingen reserveplan. Hvordan MySQL-trinnet vises, er ikke angivet, og op til 60 sekunder + eksport + reload skal rummes i 10 minutter. CHK176, CHK245 og CHK261 kan stoppe demoen. (tidl. CHK158) [Mangler]
- [ ] CHK277 - Er det fastlagt, hvilket tal der synligt ændrer sig, når demo-bookingen er oprettet? [Målbarhed; spec BR-04, AC-13.6; T051, T054] **Nej.** Standardåret er "seneste år med komplette data", så en ny booking i indeværende år ændrer ikke nødvendigvis årets indtjening, og T051 angiver ingen perioder. Nyt. [Uklart]

**Tillæggets ti spørgsmål. Intet dokumenteret svar: spørgsmål 2 og 5.** Delvist svar: 1, 4, 6, 7, 8 og 10. Dokumenteret svar: 3 og 9.

- [ ] CHK278 - Spm. 1 Arkitekturdiagram: Har det et dokumenteret svar? [Dækning; plan Summary, afsnit 4 og 7; T057] **Delvist.** Komponenter og forbindelser er beskrevet, men diagrammet findes kun som kommende task. (tidl. CHK159) [Gap]
- [ ] CHK279 - Spm. 2 Request-flow: Har det et dokumenteret svar? [Dækning; plan afsnit 1 og 4; T025] **Nej.** Der er stumper om proxy og lag, men ingen samlet beskrivelse fra klik til MySQL og tilbage, og ingen task laver den. (tidl. CHK160) [Mangler]
- [ ] CHK280 - Spm. 3 Tre lag: Har det et dokumenteret svar? [Dækning; constitution I; plan afsnit 4 og 5] **Ja**, inkl. sæson som eksempel, men se konflikten i CHK221. (tidl. CHK161)
- [ ] CHK281 - Spm. 4 Forretningslogikkens placering: Har det et dokumenteret svar? [Dækning; constitution I og VIII; plan afsnit 4 og 9] **Delvist.** Placering og begrundelse findes, men ikke konsekvensen af at flytte beregningen. Opgaven siger, at dashboardet "viser og beregner", og afstanden til constitution VIII er ikke forklaret. (tidl. CHK162) [Gap]
- [ ] CHK282 - Spm. 5 Udskiftelighed: Har det et dokumenteret svar? [Dækning; plan afsnit 1 og 4; constitution VII] **Nej.** Hverken udskiftning af MySQL eller af frontend med hotellets bookingsystem er beskrevet, kun sidebemærkninger om dependency injection og eksterne konsumenter. (tidl. CHK163) [Mangler]
- [ ] CHK283 - Spm. 6 REST-design: Har det et dokumenteret svar? [Dækning; constitution II; plan afsnit 6] **Delvist.** Endpoints og statuskoder findes, men ingen begrundelse for URL-valg og kobling til domænemodellen, og gæster mangler som ressource (CHK245). (tidl. CHK164) [Gap]
- [ ] CHK284 - Spm. 7 API-kontrakt: Har det et dokumenteret svar? [Dækning; constitution III; plan afsnit 2] **Delvist.** Sikringen af overensstemmelse er beskrevet, men kontraktens "kunder" er ikke samlet (CHK253). (tidl. CHK165) [Gap]
- [ ] CHK285 - Spm. 8 Docker: Har det et dokumenteret svar? [Dækning; plan afsnit 7] **Delvist.** Containere, servicenavne og rækkefølge findes, men ikke data ved nedlukning (CHK267). (tidl. CHK166) [Gap]
- [ ] CHK286 - Spm. 9 Fra statisk til live: Har det et dokumenteret svar? [Dækning; spec FR-02, C-01; plan afsnit 3 og 6] **Ja** for vejen fra API til Tableau. Vejen fra CSV til database mangler (CHK194), og svaret afhænger af CHK176. (tidl. CHK167)
- [ ] CHK287 - Spm. 10 Ejerskab, AI-beslutninger og største svaghed: Har det et dokumenteret svar? [Dækning; constitution "Ejerskab og AI"; spec NFR-10; plan ændringslog; T059] **Delvist.** AI-beslutninger kommer først med T059, og NFR-10 nævner manglende login som "kendt svaghed", men ingen har udpeget den største svaghed ved produktion. (tidl. CHK168) [Gap]

---

## 10. Tidsplan

- [ ] CHK288 - Er tasks prioriteret, så skelet, booking-CRUD, nøgletal og Tableau kommer først? [Prioritering; tasks "Skæringsorden", "MVP"] **Ja.** (tidl. CHK169)
- [ ] CHK289 - Er T053 placeret ens i rækkefølgen? [Konsistens; tasks "Skæringsorden", "MVP", Afhængigheder Fase 8; plan "Næste skridt" 4] **Nej.** Skæringsorden og MVP sætter T053 før Fase 5-7, mens afhængighederne kræver Fase 4-7 færdige. (tidl. CHK170) [Konflikt]
- [ ] CHK290 - Er det beskrevet, hvilke opgaver der kan skæres, hvis tiden ikke rækker? [Klarhed; spec afsnit 5; tasks "User story → fase", "Skæringsorden"] **Nej.** "Skæringsorden" er en rækkefølge. US-16 "kan skæres", men er Must have i spec og krævet af AC-13.1, og tasks siger samtidig, at alle resterende krav er afleveringskrav. Et delvist dashboard er ikke defineret. (tidl. CHK171) [Konflikt]
- [ ] CHK291 - Er planen knyttet til præsentationen fredag den 6. november? [Fuldstændighed; Opgave s. 6; plan afsnit 9] **Nej.** Datoen står ingen steder, kun "2-ugers deadline", og der er hverken milepæle eller estimater. Pr. 1/11 er der 5 dage og 62 åbne tasks. (tidl. CHK172) [Mangler]
- [ ] CHK292 - Har alle tasks en ejer i fordelingen? [Dækning; tasks "Parallellisering"] **Nej.** T001-T017, T028-T029, T038-T042, T048-T049, T053-T056 og T060-T062 er ikke fordelt, herunder selve dashboardet. (tidl. CHK173) [Gap]
- [ ] CHK293 - Er alle afleveringsopgaver med i rækkefølgen? [Dækning; tasks "MVP", Afhængigheder Fase 9; T061, T062] **Nej.** T061 og T062 mangler i både MVP-liste og afhængigheder. (tidl. CHK174) [Gap]

---

## Prioriteret liste over de vigtigste huller

Listen beskriver, hvad der skal besluttes. Den foreslår ikke selve svarene.

### Skal afklares før implementering

1. **Hvordan bliver to flade filer til databasen?** Der findes ingen leverede tabeller, datoer, værelser eller medarbejdere, så T004-T006 og dermed hele Fase 1 kan ikke udføres som skrevet. Beslut kildefil, hvad der importeres, hvad der er markeret demodata, og hvor meget data der skal til. (CHK194, CHK195, CHK201, CHK206, CHK208, CHK215, CHK217, CHK224, CHK242, CHK190)
2. **`rooms.capacity` (O-15).** Betingelsen for at spørge underviseren er opfyldt nu, og kæden rammer al booking-CRUD. Spørg, og fastlæg hvad der gælder, indtil der er svar. (CHK180, CHK210, CHK211, CHK212)
3. **Bardata.** Afgør, hvordan en aggregeret menu bliver til salg for Helene pr. år. (CHK237, CHK238, CHK239)
4. **Perioder og omsætning.** Afgør, om `end_date` tæller med, hvordan en booking fordeles over periode, sæson og år, hvad "komplette data" betyder, og hvordan værelsestype × sæson og lagplaceringen skal være. (CHK182, CHK218, CHK225, CHK220, CHK221)
5. **Booking-flowet.** Afgør, hvordan en gæst vælges eller oprettes, og hvor prisen kommer fra. Ellers kan live-demoen ikke gennemføres. (CHK245, CHK246)
6. **Tableau-kontrakten.** Definér `.hyper`-tabeller, perioder og filtre, og giv RevPAR og ADR endpoints. (CHK235, CHK219, CHK260)
7. **Eksport og afvigelser fra constitution.** Afgør, om eksporten kører efter `docker-compose up`, og hvordan O-11 og reservemetoden godkendes. (CHK176, CHK204, CHK205, CHK257, CHK259)
8. **Kontrakt-arbejdsgangen.** Afstem samme-commit-reglen, contract-first og tidspunktet for T056, da det rammer første kontraktopgave. (CHK197, CHK251)
9. **Repository og ejere.** Opret repository, navngiv de 5, registrér hvilke standardvalg der nu gælder, og sæt ejere på de ufordelte tasks. (CHK198, CHK199, CHK200, CHK272, CHK292)
10. **Tidsplan og skæreliste.** Knyt planen til 6/11, ret placeringen af T053, og fastlæg hvad der reelt kan skæres. (CHK289, CHK290, CHK291)

### Kan afklares undervejs

Skal stadig være på plads, inden de nævnte tasks startes eller afleveres.

1. **Præsentation og demo:** forløb, synligt tal, reserveplan og dokumenterede svar på spm. 2 og 5 samt den største svaghed, senest før 6/11. (CHK275-CHK277, CHK279, CHK282, CHK287)
2. **`aar` eller `year`:** før T030 og T043. (CHK207, CHK226)
3. **Svar ved tomme data og ADR ved 0 nætter:** før T035, T039 og T049. (CHK227, CHK234)
4. **Gæstetælling, landeformat og placering af indtjening pr. land:** før T033 og T034. (CHK222, CHK229, CHK230)
5. **Kundetilfredshed:** periodedato, decimaler, sletning af bookinger med rating og nye ratings, før T006, T019 og T039. (CHK184, CHK231-CHK233)
6. **Dobbeltbooking ved PUT, anden grænse og samtidighed:** før T021 og T023. (CHK189)
7. **Fejlformat, validator-tilstand, statuskoder, svarformat og bookingliste:** før T011, T012, T022 og T030. (CHK244, CHK247-CHK250)
8. **Docker:** `down` og `down -v`, frisk klon, "sund" og `extracts`, før T016, T017 og T057. (CHK256, CHK264, CHK266, CHK267)
9. **Eksportens robusthed og Tableau-licens:** før T051 og T054. (CHK261, CHK262)
10. **Swagger UI "Try it out":** før Fase 2-checkpoint. (CHK252)
11. **Målemetode for NFR-09 og AC-10.3:** før T047 og T062. (CHK185, CHK186, CHK243)
12. **Dokumentoprydning:** forældede henvisninger, versionsnumre, Sync Impact Report, projektstruktur og C-09. (CHK213, CHK214, CHK255, CHK268, CHK269)
13. **Converge og ejerskab:** format og gentagelse af Converge samt hvordan forklaringskravet vises. (CHK273, CHK274)

---

## Notes

- Mark items `[x]` only after review confirms the requirement-quality criterion is satisfied.
- Lad punkter stå åbne, så længe de kræver afklaring, rettelse eller vurdering fra anmelderen.
- `/speckit-implement` læser tjeklistens tilstand som gate og må ikke ændre markeringer.
- `checklists/requirements.md` har sin egen livscyklus. Den fil findes ikke i dette projekt.
- Constitution, spec, plan, tasks og de to tidligere tjeklister er ikke ændret af denne kørsel.
- Punkter uden krav i Opgaven (fx samtidige oprettelser) spørger kun, om emnet er taget stilling til. Et bevidst fravalg er også et gyldigt svar.
- Datatjekket er udført på filerne pr. 2026-11-01. Ændres datagrundlaget, skal punkterne med henvisning til hoteldata og bardata læses igen.
