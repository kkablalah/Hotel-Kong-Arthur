# Kravkvalitetstjekliste, genkontrol: Hotel Kong Arthur dataanalyse-platform

**Purpose**: Validerer kvaliteten af kravene (fuldstændighed, klarhed, konsistens, målbarhed, dækning) i constitution v1.1.0, spec.md (inkl. Clarifications), plan.md og tasks.md (62 opgaver). Tjeklisten tester kravene, ikke om koden virker.
**Created**: 2026-11-01
**Feature**: `specs/hotel-kong-arthur/spec.md` | **Plan**: `plan.md` | **Tasks**: `tasks.md` | **Constitution**: `.specify/memory/constitution.md`
**Forrige tjekliste**: `checklists/kravkvalitet.md` (CHK001-CHK059) er uændret. Nummereringen fortsætter derfor fra CHK060.

**Review Ownership**: Tjeklisten tilhører anmelderen. Sæt kun `[x]`, når anmelderen har vurderet, at krav-kvalitetskriteriet er opfyldt. `[x]` betyder IKKE, at implementeringen er færdig. Alle punkter står åbne; "Vurdering" er et forslag til anmelderen.

**Markeringer**: `[Gap]` = kravet er delvist dækket. `[Uklart]` = kravet er tvetydigt eller uafklaret. `[Konflikt]` = kilderne strider mod hinanden. `[Mangler]` = kravet findes ikke. Punkter uden markering vurderes som tilstrækkelige.

## Grundlag for vurderingen

**Implementeret kode**: Ingen. POC-mappen indeholder kun `.specify/`, `.vibe/`, `specs/` og `Specify.md.txt`, 0 af 62 tasks er afkrydset, og mappen er ikke et git-repository. Der er derfor ingen krav, der ser implementeret ud.

**Kilder ud over de fire styrende filer** (bruges kun som kontrol, ikke som nye krav):

- **Opgave**: `E26 Tværfaglig Opgave Hotel Kong Arthur.pdf`
- **Tillæg**: `Tillægsspørgsmål_swa.pdf`
- **Hoteldata**: `international_names_with_rooms_1000.csv` (og samme indhold som .xlsx)
- **Bardata**: `drinks_menu_with_sales.xlsx`

**Hvad de leverede data faktisk indeholder** (filerne svarer i navn og størrelse til indholdet af github.com/ITAKEA/hoteldata pr. 2026-11-01):

| Fil | Indhold | Findes IKKE i filen |
|---|---|---|
| Hoteldata (1000 rækker) | `First Name`, `Family Name`, `Country` (20 lande, fulde navne, ingen tomme), `Room Type` (8 engelske navne, fx `Standard Single`), `Days Rented` (1-10), `Season` (low/mid/high), `Price` | Datoer, år, værelsesnummer, `capacity`, `guest_count`, antal værelser pr. type, e-mail, telefon |
| Bardata (30 rækker) | `Drink Name`, `Category` (20 Cocktail + 10 Coffee), `Price (DKK)`, `Units Sold` | Transaktioner, datoer, år, medarbejder |

Der findes ingen leverede SQL-tabeller, ingen ratings og ingen rækker for 214 værelser.

---

## 1. Genkontrol af tidligere huller

### Live

- [ ] CHK060 - Er "live" entydigt defineret og dækket af tasks (næste GET uden caching, eksport hvert 60. sekund)? [Klarhed, spec FR-02, C-01, C-14, AC-05.4; plan afsnit 6; T028, T029, T051, T052] — Vurdering: ja, tidligere CHK027, CHK028 og CHK033 er løst på definitionsniveau.
- [ ] CHK061 - Er kravet "eksporten kører hvert 60. sekund" foreneligt med, at `tableau-export` ligger bag profilen `extract`? [Konsistens, spec FR-02; plan afsnit 7; T052] — Vurdering: nej, efter en almindelig `docker-compose up` kører der ingen eksport. [Konflikt]
- [ ] CHK062 - Er dashboardets forsinkelse angivet ens på tværs af filerne? [Konsistens, spec FR-02; plan afsnit 3.3] — Vurdering: nej, spec siger "højst ét interval plus reload", plan kalder samme tal "minimumsforsinkelse", og ingen af dem medregner eksportens op til 30 sekunder. [Konflikt]
- [ ] CHK063 - Er "ingen caching" afgrænset (applikation, HTTP, Nginx), og stemmer planens "senere optimering (cache med TTL)" med C-01? [Klarhed, spec C-01; plan afsnit 6; T028] — Vurdering: nej, afgrænsningen mangler, og TTL-sætningen står uden forbehold. [Uklart]

### Kapacitet pr. booking

- [ ] CHK064 - Er reglen `1 <= guest_count <= rooms.capacity` (kapacitet 1-4) entydig og dækket af tasks? [Klarhed, spec FR-01, AC-01.5; plan afsnit 4 og 8; T020, T023] — Vurdering: ja som regel, tidligere CHK024 er løst på papiret.
- [ ] CHK065 - Kan reglen verificeres med de leverede data? [Målbarhed, spec afsnit 6.1; plan afsnit 5; T020] — Vurdering: nej, hverken `capacity` eller `guest_count` findes i dataene, se CHK093. [Mangler]

### Belægningsformel

- [ ] CHK066 - Er nattællingen i `[check_in, check_out)` og nævneren 214 × nætter entydig og ens overalt? [Konsistens, spec BR-01, C-05; plan afsnit 8; T032, T037] — Vurdering: ja.
- [ ] CHK067 - Er "antal nætter i perioden" entydigt, altså om `end_date` selv tæller med? [Klarhed, spec BR-01, BR-09; plan afsnit 6; T030, T035] — Vurdering: nej, det står ingen steder, og forskellen ændrer både belægning, RevPAR og kontrolforespørgslerne. [Uklart]
- [ ] CHK068 - Er ikke-tilgængelige værelser defineret, når nævneren altid er 214? [Fuldstændighed, spec FR-03, C-05, AC-06.4; plan afsnit 5 `rooms.is_active`] — Vurdering: nej, C-05 stiller spørgsmålet, men svaret nævner dem ikke. Det er heller ikke klart, om inaktive værelser kan bookes, og hvornår AC-06.4 ("no usable capacity data") kan indtræde. [Uklart]

### Afrunding og tolerance

- [ ] CHK069 - Er tolerancerne 0,01 DKK og 0,1 procentpoint anvendt ens og dækket af kontroltests? [Konsistens, spec BR-02, AC-13.5; plan afsnit 8; T037, T047, T049, T055] — Vurdering: ja, tidligere CHK010 er løst, men T042 nævner ingen tolerance, og antal decimaler for gennemsnitsrating er ikke fastlagt. [Gap]

### Målbare NFR'er

- [ ] CHK070 - Er 2 s, 500 ms og 30 s kvantificeret og dækket af tasks? [Målbarhed, spec NFR-09; plan afsnit 8; T051, T053, T062] — Vurdering: delvist, T062 henviser 30-sekunders-målingen til T053, men T053 nævner den ikke. [Gap]
- [ ] CHK071 - Er målemetoden defineret (størrelsen på "demo dataset", enkeltkald eller percentil, maskine)? [Målbarhed, spec NFR-09; tasks O-12, T062] — Vurdering: nej, O-12 angiver dækning, men ikke datamængde. [Uklart]

### Sikkerhedsafgrænsning

- [ ] CHK072 - Er afgrænsningen entydig og dækket (ingen login som bevidst svaghed, parametriserede queries, ingen stack traces)? [Klarhed, spec afsnit 3.2, NFR-10; plan afsnit 1, 6 og 8; T057, T062] — Vurdering: ja, tidligere CHK052 er løst. T062 tester dog injection i "gæstenavn", og det felt findes ikke i booking-kontrakten eller formularen (T018, T025). [Uklart]

### Dobbeltbooking

- [ ] CHK073 - Er overlap og samme-dags-grænsetilfældet entydigt defineret? [Klarhed, spec BR-10, C-Session 2026-10-29; plan afsnit 4 og 8; T019, T023] — Vurdering: ja, tidligere CHK023 er løst.
- [ ] CHK074 - Er de øvrige scenarier dækket: ny `check_out` = eksisterende `check_in`, PUT der ikke må konflikte med sig selv, PUT → 409 og samtidige oprettelser? [Dækning, spec BR-10; plan afsnit 6; T021, T023] — Vurdering: nej, T023 tester kun den ene grænse og ingen PUT-konflikt, og samtidighed er ikke nævnt. [Gap]

### "Ukendt" land

- [ ] CHK075 - Er "Ukendt" navngivet, medregnet i totaler og dækket af tasks for både omsætning og gæster? [Klarhed, spec AC-08.4; plan afsnit 5 og 6; T033, T034, T037] — Vurdering: delvist, tidligere CHK015 er løst i T034, men T033 nævner ikke reglen. CSV'en har ingen tomme lande, og der er ikke beskrevet, hvor testrækker uden land kommer fra. [Gap]

### Datoformat

- [ ] CHK076 - Er ISO 8601 fastlagt for alle datoparametre og -felter? [Konsistens, plan afsnit 6; T007, T018, T030] — Vurdering: ja i plan og tasks, tidligere CHK039 er løst. Spec.md nævner det ikke, og T038 og T043 gentager det ikke. [Gap]

### db/-produktionen

- [ ] CHK077 - Er fremgangsmåden i MySQL Workbench beskrevet trin for trin? [Klarhed, plan afsnit 5 og 7; T004, T005] — Vurdering: ja, tidligere CHK047 er løst som procedure.
- [ ] CHK078 - Findes det, proceduren eksporterer fra? [Konsistens, spec afsnit 1.2 og 6.3; plan afsnit 5; T004, T005] — Vurdering: nej. T004 forudsætter "leverede tabeller" (rooms, guests, bookings, employees, cocktail_sales m.fl.), men der er kun to flade filer. Ingen task beskriver import og normalisering til MySQL. T005's færdig-betingelse (214 værelser og medarbejdere "stemmer med CSV") kan ikke opfyldes. [Konflikt]

### Konfliktprocedure for openapi.yaml

- [ ] CHK079 - Er proceduren entydig og tilgængelig for alle 5? [Klarhed, tasks "Procedure ved openapi/openapi.yaml"; T058] — Vurdering: ja i tasks, tidligere CHK041 er løst, men T058 (CONTRIBUTE.md) og plan afsnit 2 nævner den ikke. [Gap]
- [ ] CHK080 - Kan proceduren følges fra første kontraktopgave? [Konsistens, tasks Afhængigheder; T007, T018, T056] — Vurdering: nej, den kræver kørsel af T056, som ligger i Fase 9 (P2) og tidligst laves efter Fase 2. [Konflikt]

### Commits fra alle 5

- [ ] CHK081 - Er kravet verificerbart? [Målbarhed, constitution "Git"; opgave s. 5; T060, T061] — Vurdering: delvist, tidligere CHK057 er løst med T061. De 5 navne er dog ikke angivet, T061 skriver i et Converge-resultat fra T060, der først kører, "når alt andet er færdigt", og der findes endnu intet repository (CHK154). [Gap]

---

## 2. Åbne punkter

Status pr. 2026-11-01. Fristen 30/10 er overskredet, og ingen beslutning er registreret: filerne blev sidst ændret 29/10.

| ID | Ejer | Frist | Blokerede tasks angivet | Standardvalg | Konsistent med spec og plan? |
|---|---|---|---|---|---|
| O-1 | A (rolle) | 30/10, overskredet | Ja: T005, metrics-tests | Fordeling fra leveret data | **Nej**, dataene har ingen værelsesfordeling |
| O-7 | D (rolle) | 30/10, overskredet | Ja: T005, T006, T044, tests | Markeret demodata | Ja med BR-06, men omfanget er undervurderet |
| O-8 | B (rolle) | 30/10, overskredet | Ja: T001, T007-T013, tests | Express, ingen Knex, `node --test` | **Ja** |
| O-10 | E (rolle) | 30/10, overskredet | Ja: ingen task | Implementeres ikke | Delvist, plan bruger den stadig som mitigering |
| O-11 | Ingen | 30/10, overskredet | Nævnt indirekte: T052, T057 | Profil beholdes | **Nej**, står som "afgjort", men plan kræver godkendelse |
| O-12 | C (rolle) | 30/10, overskredet | Ja: T006, tests, demo | Mindstekrav til dækning | Delvist, afviger fra T006 |
| O-13 | B (rolle) | 30/10, overskredet | Ja: T007, T013, T018, T030 | Engelsk | Delvist, `aar` er dansk, og plan afsnit 6 er forældet |
| O-14 | A (rolle) | 30/10, overskredet | Ja: T004-T006 | Eksporten er autoritativ | **Nej**, der findes intet at eksportere |
| O-15 | A + underviser | 30/10, derefter åben | Ja: T020, T023, AC-01.5 | "Spørg underviseren" | Ja med spec, men er ikke et brugbart standardvalg |

- [ ] CHK082 - Har hvert åbent punkt en navngiven ejer? [Fuldstændighed, tasks "Åbne punkter"] — Vurdering: nej, kun rollebogstaver A-E uden kobling til personer. Fase 1-opgaver blokeres af punkter, hvis ejere først får opgaver efter Fase 1. [Gap]
- [ ] CHK083 - Er det registreret, hvad der gælder nu, hvor fristen er overskredet? [Klarhed, tasks "Åbne punkter"] — Vurdering: nej, reglen siger, at standardvalget gælder, men alle punkter står stadig som åbne uden ny frist. [Uklart]
- [ ] CHK084 - O-1: Er standardvalget muligt? [Konsistens, spec C-08, afsnit 6.1, BR-05; tasks O-1, T005] — Vurdering: nej. C-08 står som RESOLVED med henvisning til datarepoet, men CSV'en viser fordeling af bookinger, ikke af de 214 værelser. Spec afsnit 6.1 er desuden cirkulær: hvis kilden mangler, bruges kilden. T057 nævner heller ikke den README-note, O-1 kræver. [Konflikt]
- [ ] CHK085 - O-7: Dækker punktet det, der reelt mangler? [Fuldstændighed, spec C-13, afsnit 6.3; tasks O-7, T006] — Vurdering: nej, det nævner medarbejderattribution, men ikke datoer, værelser og `guest_count` for de 1000 rækker. [Gap]
- [ ] CHK086 - O-8: Er standardvalget konsistent med plan og tasks? [Konsistens, plan afsnit 1, 8 og 9; T001] — Vurdering: ja. `dotenv` i T001 har dog ingen begrundelse i planen. [Gap]
- [ ] CHK087 - O-10: Er standardvalget konsistent i hele planen? [Konsistens, plan afsnit 3.4, 9 og 10; tasks O-10] — Vurdering: delvist, "implementeres ikke" står ved siden af risikotabellen, der bruger reservemetoden som mitigering. [Konflikt]
- [ ] CHK088 - O-11: Er status entydig? [Konsistens, constitution V; opgave s. 5; plan afsnit 7, 9 og 10; tasks O-11] — Vurdering: nej. Punktet står under "Afgjorte" med en åben godkendelsesfrist, plan kræver gruppegodkendelse, og både constitution V og opgaven kræver én kommando. [Konflikt]
- [ ] CHK089 - O-12: Stemmer mindstekravene overens med T006, og kan de opfyldes? [Konsistens, tasks O-12, T006] — Vurdering: nej. T006 kræver "mindst 5 lande" for `cocktail_sales`, der ikke har noget land, og nævner ikke de 8 værelsestyper. Ingen af delene definerer et komplet år (CHK107). [Uklart]
- [ ] CHK090 - O-13: Følger alle henvisninger valget? [Konsistens, plan afsnit 6 og 9; tasks O-13] — Vurdering: nej. Plan afsnit 6 nævner stadig `GET /api/vaerelser` i T012 og O-9, mens det rigtige er `GET /api/rooms` i T013 og O-13. Parameteren `aar` er dansk i et ellers engelsk API. [Konflikt]
- [ ] CHK091 - O-14: Er konsekvensen for senere tasks beskrevet, hvis det faktiske schema afviger? [Dækning, plan afsnit 5; tasks O-14] — Vurdering: nej. Plan afsnit 5 bygger på "T004-schemaet", og T004 bygger på plan afsnit 5, så grundlaget er cirkulært. T009, T019, T032-T034 og T044 afhænger af resultatet, men er ikke nævnt. [Uklart]
- [ ] CHK092 - O-15: Er det klart, at `rooms.capacity` blokerer T020 og T023? [Klarhed, tasks O-15, T020] — Vurdering: ja, det er eksplicit.
- [ ] CHK093 - O-15: Er det klart, hvad der sker, når dataene ikke indeholder værdierne? [Fuldstændighed, spec FR-01, afsnit 6.1; plan afsnit 5; tasks O-15] — Vurdering: kun delvist. Reglen er "spørg underviseren, opfind ikke værdier", og den situation er indtrådt nu. Antagelsen "feltet findes i leveret data" er forkert. Der er ingen svarfrist, ingen adfærd for værelser uden værdi, og `03_extensions.sql` (T006) har ikke `rooms.capacity` med. [Mangler]
- [ ] CHK094 - O-15: Er hele blokeringskæden angivet? [Dækning, tasks Afhængigheder, O-15] — Vurdering: nej. T020 → T021 → T022 → T024-T027 → T028 betyder, at en manglende afklaring rammer al booking-CRUD og live-demoen. T006 (`guest_count` på eksisterende bookinger) er også afhængig. [Gap]
- [ ] CHK095 - Er kapacitet defineret pr. værelse eller pr. type? [Klarhed, spec afsnit 6.1; opgave s. 2 "afhængig af værelsets størrelse og kategori"] — Vurdering: spec siger pr. værelse, men der er ikke taget stilling til, om den kan udledes af kategorien, hvilket netop er spørgsmålet til underviseren. [Uklart]
- [ ] CHK096 - Er alle uafklarede C-punkter ført over til åbne punkter? [Dækning, spec afsnit 10 C-09, C-13; plan "Næste skridt"] — Vurdering: nej, C-09 er åben og har intet O-punkt, og plan "Næste skridt" nævner hverken O-1, O-7, O-12 eller O-14. [Gap]
- [ ] CHK097 - Peger henvisningerne til O-punkter og beslutninger på det rigtige? [Konsistens] — Vurdering: nej. Plan afsnit 5 kalder attribution O-8 (skal være O-7), tasks Fase 7 afhænger af "beslutningen i T048" (O-3 er afgjort), tasks Fase 8 kalder O-9 åbent, og tasks "Prerequisites" nævner BR-01-08 (spec har BR-01-10). [Konflikt]

---

## 3. Nøgletal

### Datagrundlag og periode

- [ ] CHK098 - Er det fastlagt, hvordan historiske bookinger får datoer? [Fuldstændighed, spec afsnit 6.3, BR-01, BR-04; plan afsnit 5; T005, T006] — Vurdering: nej, `check_in_date` og `check_out_date` er obligatoriske i modellen og findes ikke i dataene. Belægning, år, perioder, RevPAR og ADR afhænger af det. Opgaven kalder dataene "inspiration", men beslutningen er ikke truffet eller dokumenteret. [Mangler]
- [ ] CHK099 - Er det fastlagt, hvad der gælder for historiske rækker: CSV-kolonnen `Season` eller BR-03? [Konsistens, spec BR-03; T031] — Vurdering: nej, kolonnen er ikke nævnt nogen steder, og opdigtede datoer kan modsige den. [Uklart]
- [ ] CHK100 - Er sæsonernes datoer entydige og dækker de hele året uden overlap? [Klarhed, spec BR-03, C-02, C-03; plan afsnit 5; T031] — Vurdering: ja, og de er ens i alle tre filer.
- [ ] CHK101 - Er omsætning defineret for bookinger, der krydser sæson, år eller rapporteringsperiode? [Fuldstændighed, spec FR-04, AC-07.5, BR-02] — Vurdering: nej. AC-07.5 henviser til en afklaring, der ikke findes, og FR-04 kræver, at det dokumenteres før implementering. Det er heller ikke defineret, om en booking tilhører en periode efter `check_in`, overlap eller nætter, og ADR blander hel bookingværdi med nætter i perioden. [Mangler]

### Indtjening

- [ ] CHK102 - Er "indtjening pr. værelsestype pr. sæson" understøttet som kombination? [Konsistens, opgave s. 4; spec US-07; plan afsnit 6 `group_by`; T030, T033] — Vurdering: nej, `group_by` tager én værdi, og T033 grupperer separat. Tasks Fase 4 kalder det alligevel "pr. værelsestype pr. sæson". [Konflikt]
- [ ] CHK103 - Er indtjening pr. land entydigt placeret? [Konsistens, spec AC-08.1; T033, T034] — Vurdering: nej, både `revenueRepository` og `guestsRepository` skal beregne omsætning pr. land. [Uklart]
- [ ] CHK104 - Er lagplaceringen af sæson og nattælling konsistent med princip I? [Konsistens, constitution I; plan afsnit 4 og 5; T031, T032, T033] — Vurdering: nej. Sæson er "beregning i business-laget" og ingen tabel, men T033 kræver SQL-gruppering pr. sæson. T032 lægger også nattællingsreglen i SQL, og T033 lægger standardåret i repository. [Konflikt]
- [ ] CHK105 - Er "hvilke værelser og lande tjener mest" entydigt besvaret? [Klarhed, opgave s. 4; spec Goals 5, AC-07.4, AC-08.3; plan afsnit 6; T033] — Vurdering: ja for lande og værelsestyper via faldende sortering. At "værelser" betyder værelsestyper er kun implicit, og T030 nævner ikke sorteringen, som plan placerer i kontrakten. [Gap]
- [ ] CHK106 - Er der en kobling mellem værelsestypenavnene i spec og i dataene? [Konsistens, spec afsnit 6.1; hoteldata] — Vurdering: nej, fx "Standard Enkeltværelse" mod `Standard Single`. [Gap]
- [ ] CHK107 - Er årets indtjening og `?aar=` entydigt? [Klarhed, spec FR-05, BR-04, C-07; T030, T033, T035] — Vurdering: parameteren er det, men "seneste år med komplette data" er udefineret. Dataene har intet år, og det er uklart, hvordan nye bookinger i indeværende år påvirker valget, og om hotel og bar har hver sin standard. [Uklart]
- [ ] CHK108 - Hedder årsparameteren det samme overalt? [Konsistens, spec BR-04; plan afsnit 6; T030, T043] — Vurdering: nej, plan bruger `year` på cocktail-endpoints, mens spec og tasks bruger `aar`. Plan angiver heller ikke standardår for cocktail. [Konflikt]
- [ ] CHK109 - Er svaret ved manglende data entydigt? [Klarhed, spec AC-06.4, AC-09.4, AC-11.4, AC-16.4, BR-08; plan afsnit 6; T035, T039] — Vurdering: nej. AC-09.4 og AC-16.4 tillader "besked eller nul", plan giver 404 for annual, men 200/400 for satisfaction, BR-08 kræver et tomt resultat, og AC-11.4 henviser til regler, der ikke findes. [Uklart]
- [ ] CHK110 - Er det fastlagt, om CSV'ens `Price` er `total_price` inkl. skatter og gebyrer? [Klarhed, spec BR-02, C-06; plan afsnit 5] — Vurdering: nej, det er kun implicit. [Gap]

### Gæster pr. land

- [ ] CHK111 - Er "gæster pr. land" entydigt og har det acceptkriterier? [Målbarhed, spec FR-06, AC-13.1; T034] — Vurdering: nej. Det er ikke fastlagt, om der tælles unikke gæster, bookinger eller summen af `guest_count`. Periodegrundlaget mangler, og US-08 dækker kun omsætning. CSV'en har højst 400 navnekombinationer på 1000 rækker, så navne går igen, og reglen for, hvornår to rækker er samme gæst, mangler. [Uklart]
- [ ] CHK112 - Stemmer landeformatet med dataene? [Konsistens, plan afsnit 5 "ISO-kode (FR-06)"; spec FR-06; hoteldata] — Vurdering: nej, FR-06 nævner ingen ISO-kode, og dataene har fulde landenavne. [Konflikt]

### Kundetilfredshed

- [ ] CHK113 - Er kundetilfredshed entydigt defineret? [Klarhed, spec FR-14, BR-08, AC-16; plan afsnit 5; T006, T039-T042] — Vurdering: formel, skala, eksklusion og demodata er på plads. Det er ikke defineret, hvilken dato perioden måles på (`created_at`, indtjekning eller udtjekning). [Uklart]
- [ ] CHK114 - Er sletning af en booking med rating defineret? [Dækning, spec AC-04, BR-08; plan afsnit 5; T006, T019, T027] — Vurdering: nej, fremmednøglen og kravet om DELETE → 204 er ikke afstemt, og BR-08's "ratings uden booking" kan ikke opstå med en fremmednøgle. Det er heller ikke afgjort, om sletning er fysisk eller logisk. [Gap]

### RevPAR og ADR

- [ ] CHK115 - Er RevPAR og ADR entydigt defineret med formål og periode? [Klarhed, spec FR-10, BR-09; T048, T049] — Vurdering: ja for formlerne, tidligere CHK014 er løst. ADR ved 0 belagte nætter er ikke defineret, og FR-10 har ingen user story eller AC ud over AC-13.1. [Gap]
- [ ] CHK116 - Har RevPAR og ADR endpoints, og når de frem til dashboardet? [Konsistens, plan afsnit 4, 6 og 8; T049, T051, T054] — Vurdering: nej. Plan nævner dem kun i ændringsloggen, T049 navngiver ingen URL, og T051's endpoint-liste indeholder dem ikke, selv om T054 skal vise dem. [Mangler]
- [ ] CHK117 - Er "belægning over tid" specificeret med en tidsopløsning? [Klarhed, spec FR-03; opgave s. 5 (månedligt eksempel); plan afsnit 6; T054] — Vurdering: nej, endpointet giver én værdi pr. periode, og ingen opløsning er nævnt. [Uklart]

---

## 4. Cocktailbar

- [ ] CHK118 - Er Helene Christines samlede salg entydigt defineret? [Klarhed, spec FR-07, BR-06, C-10, AC-10; T044, T045] — Vurdering: ja som formel. Hvordan backenden identificerer Helene, er ikke angivet. [Uklart]
- [ ] CHK119 - Er datakilden dækket? [Konsistens, spec C-09, afsnit 6.2; plan afsnit 5; T004-T006; bardata] — Vurdering: nej. T004 kalder `cocktail_sales` og `employees` for leverede tabeller, men bardata er en aggregeret menu uden transaktioner, år og medarbejder. C-09 står stadig åben. [Konflikt]
- [ ] CHK120 - Er det fastlagt, hvordan aggregerede tal bliver til salg pr. år og medarbejder? [Fuldstændighed, spec BR-06, afsnit 6.3; opgave s. 3; T006] — Vurdering: nej. Opgaven siger, at Helene laver alle 30 drikke, men det er ikke afgjort, om hele filen er hendes salg, hvilket år den gælder, eller om simuleret salg skal stemme med `Units Sold`. [Uklart]
- [ ] CHK121 - Er omsætning pr. drink entydig? [Klarhed, spec FR-08, AC-11; plan afsnit 6; T044, T045] — Vurdering: rangering ja, men det er uklart, om tallet gælder alle medarbejdere eller kun Helene, og endpointet kræver datoer, som bardata ikke har. [Uklart]
- [ ] CHK122 - Er begge fordelinger defineret med nævner og decimaler? [Målbarhed, spec FR-09, BR-07, AC-12; plan afsnit 6; T043-T047] — Vurdering: ja, tidligere CHK019 er løst. T044 punkt 3 nævner dog ikke, at fordelingen kun gælder Helene. [Gap]
- [ ] CHK123 - Er 20 cocktails og 10 kaffetyper dækket? [Dækning, spec afsnit 6.2; plan afsnit 5; T005, T006; bardata] — Vurdering: dataene stemmer (20 + 10), men T005 og T006 tjekker kun "30 produkter". Afrunding af priser som `91.40000000000001` til DECIMAL er ikke nævnt. [Gap]
- [ ] CHK124 - Er demodata reelt til at skelne fra historiske data? [Målbarhed, spec afsnit 6.3, BR-06, BR-08; T006, T054, T057] — Vurdering: nej. T006 tillader "kolonne eller kommentar", og en kommentar kan ikke ses i API eller dashboard. BR-06 kræver dokumentation af simuleringen, men ingen task leverer den, og "where necessary" er ikke afgrænset. [Uklart]

---

## 5. API og kontrakt

- [ ] CHK125 - Er endpoints, URL-struktur, metoder og statuskoder specificeret? [Fuldstændighed, constitution II; plan afsnit 6; T007, T018, T030, T038, T043] — Vurdering: ja for bookings, metrics, cocktail og `/health`. `GET /api/rooms` står ikke i plan afsnit 6's tabeller, og RevPAR/ADR mangler (CHK116). [Gap]
- [ ] CHK126 - Kan en booking oprettes med de endpoints, der er specificeret? [Fuldstændighed, spec FR-01; plan afsnit 5 og 6; T019, T025] — Vurdering: nej, en booking kræver `guest_id`, og T025 har feltet "gæst", men der findes intet endpoint til at finde eller oprette en gæst. Hvor en ny gæsts land kommer fra, er heller ikke beskrevet. [Mangler]
- [ ] CHK127 - Er det fastlagt, hvor `total_price` kommer fra? [Klarhed, spec BR-02; plan afsnit 5; T020, T025] — Vurdering: nej, feltet indtastes i formularen uden regel eller kobling til priserne pr. nat og sæson. [Uklart]
- [ ] CHK128 - Er 400, 404 og 409 entydige for bookings? [Klarhed, spec BR-10, AC-01.5, AC-02.3; plan afsnit 6 og 8; T022, T023] — Vurdering: ja. Statuskoden for en ikke-eksisterende `room_id` eller `guest_id` er ikke angivet. [Gap]
- [ ] CHK129 - Er fejlformatet uden stack traces specificeret for alle fejl? [Fuldstændighed, spec NFR-10; plan afsnit 6; T011, T056, T062] — Vurdering: ja for 400/404/409/500. Det er ikke beskrevet, om validatorens egne fejl oversættes til formatet, eller hvad der gælder ved ugyldig JSON, ukendt route og forkert metode. [Gap]
- [ ] CHK130 - Er metoden til at holde kontrakt og kode ens beskrevet og dækket? [Konsistens, constitution III; plan afsnit 2 og 8; T012, T056] — Vurdering: ja. "I hvert fald i test; i produktion kan den køre i warn-mode" står dog mod T012 ("afvises"), så adfærden ved demoen er uafklaret. [Uklart]
- [ ] CHK131 - Er "samme commit" foreneligt med contract-first og "commit efter hver opgave"? [Konsistens, constitution III; plan afsnit 2; tasks Notes; T018, T022, T056] — Vurdering: nej. Kontrakten ligger i en task før koden, og med T056 aktiv fejler testen, så snart et dokumenteret endpoint ikke har en route. [Konflikt]
- [ ] CHK132 - Er Swagger UI's "Try it out" dækket? [Konsistens, plan afsnit 1, 2 og 9; tasks Fase 2 Checkpoint] — Vurdering: nej. Planen fjerner CORS med begrundelse i frontendens proxy, men Swagger UI kører på 8080 og API'et på 8000, og Fase 2 skal kunne demonstreres i Swagger UI. [Gap]
- [ ] CHK133 - Er listen af bookinger specificeret ved mange rækker? [Målbarhed, spec NFR-09; plan afsnit 6; T019] — Vurdering: nej, filterparametre og sideinddeling er ikke angivet, selv om CRUD skal svare på 500 ms. [Gap]
- [ ] CHK134 - Er hotellets eget bookingsystem dækket som kunde til kontrakten? [Dækning, constitution VII; opgave s. 5; spec afsnit 3.2; plan afsnit 1] — Vurdering: kun som bemærkning, uden AC eller task, og spec afsnit 3.2 udelukker selve integrationen. [Uklart]

---

## 6. Tableau

- [ ] CHK135 - Er Python-scriptet med Hyper API beskrevet ens? [Konsistens, constitution IX; plan afsnit 1, 3.1 og 3.2; T050, T051; tasks Notes] — Vurdering: ja, eget værktøj, egen container, kun REST og ingen forretningslogik.
- [ ] CHK136 - Er status på undtagelsen til princip IX ens på tværs af filerne? [Konsistens, constitution IX og Sync Impact Report; plan sidehoved, afsnit 3.2, 9 og 10; tasks O-9] — Vurdering: nej. Plan afsnit 3.2 siger stadig "gruppebeslutning påkrævet" med alternativer, afsnit 9 og 10 siger besluttet. Plans sidehoved siger constitution v1.0.0, og Sync Impact Report står på 1.0.0, mens constitution selv er 1.1.0. [Konflikt]
- [ ] CHK137 - Er den monterede mappe ens beskrevet? [Konsistens, plan afsnit 3.1 og 7; T003, T016, T051, T052] — Vurdering: nej. Plan og T052 bruger host-mount `./extracts`, T016 opretter en navngivet volume `extracts`, og `EXTRACT_OUTPUT_PATH` mangler i plan afsnit 7 og T003. [Konflikt]
- [ ] CHK138 - Er intervallet og kørselsformerne entydige? [Klarhed, spec C-14; plan afsnit 3.1; T051, T052, T053] — Vurdering: 60 sekunder er ens overalt. Plan beskriver også én manuel kørsel, men T051 har kun løkken, så det er uklart, om `docker-compose run tableau-export` i T053 stopper. [Uklart]
- [ ] CHK139 - Er begrænsningerne i forhold til live dækket? [Fuldstændighed, spec FR-02, AC-13.6; plan afsnit 3.3; T055, T057] — Vurdering: ja i README. Planens risikotabel kræver også tekst i selve dashboardet, og det har T054 ikke med. [Gap]
- [ ] CHK140 - Er reservemetoden konsistent med constitution? [Konsistens, constitution VIII og Governance; plan afsnit 3.4 og 10; tasks O-10] — Vurdering: nej. Plan og tasks er enige om "kun med gruppens godkendelse", men constitution VIII har ingen undtagelse, og forfatningen går forud ved konflikter. Modsat princip IX er der ingen ændring af constitution. Read-only-brugeren og adgang til port 3306 har ingen task. [Konflikt]
- [ ] CHK141 - Er datakontrakten mellem API og Tableau defineret? [Fuldstændighed, spec afsnit 9 punkt 7, FR-11, AC-13.3; constitution VIII; T051, T054] — Vurdering: nej. Tabeller i `.hyper`-filen, perioder og tidsopløsning for de kaldte endpoints er ikke angivet. Det er også uklart, hvordan filtre på periode kan virke på færdigberegnede tal, uden at Tableau selv beregner. [Mangler]
- [ ] CHK142 - Er scriptets fejladfærd defineret? [Dækning, plan afsnit 3.1; T051, T053] — Vurdering: nej. Hverken backend nede eller manglende endpoint er beskrevet, og den tidlige forbindelsestest (T053) kører, før satisfaction- og cocktail-endpoints findes. [Gap]
- [ ] CHK143 - Er det beskrevet, hvad der sker, hvis Tableau har filen åben under omdøbningen? [Dækning, plan afsnit 3.1 og 9] — Vurdering: nej, det er vurderet som lav risiko uden en krævet test på Windows-værter, og det er netop demoens situation. [Gap]
- [ ] CHK144 - Er Tableau-licensen afklaret? [Antagelse, plan afsnit 9 "Kritiske afhængigheder"; T054] — Vurdering: nej, licens og alternativet Tableau Public er nævnt uden ejer eller verifikation af, at T054's `.twbx` kan laves. [Uklart]

---

## 7. Docker og drift

- [ ] CHK145 - Er services, images og porte beskrevet og dækket? [Fuldstændighed, plan afsnit 7; T014-T016, T052] — Vurdering: ja. Værktøjet `tableau-export` er uden for `docker-compose up`, se CHK088.
- [ ] CHK146 - Er start-rækkefølge og healthchecks entydige? [Klarhed, constitution V; spec AC-15.4; plan afsnit 7; T016] — Vurdering: rækkefølgen ja. Det er ikke defineret, om "sund" betyder, at 01-03-filerne er indlæst (`mysqladmin ping` viser kun, at serveren svarer), om `/health` tjekker databasen, eller hvad frontenden viser, når backenden er nede. [Uklart]
- [ ] CHK147 - Er volumes og automatisk indlæsning ved første opstart beskrevet? [Fuldstændighed, constitution IV og V; plan afsnit 7; T016] — Vurdering: ja. T002's `mysql_data/` i `.gitignore` passer dog ikke til en navngiven volume. [Gap]
- [ ] CHK148 - Er `.env` og `.env.example` dækket, også fra en frisk klon? [Fuldstændighed, constitution VI; spec AC-15.5; plan afsnit 7; T002, T003, T017] — Vurdering: delvist. Der er intet trin, der opretter `.env` efter kloning, T003 henviser til værdier, plan ikke angiver, og koblingen fra `DB_*` til MySQL-containerens variabler er ikke beskrevet. [Gap]
- [ ] CHK149 - Er det klart beskrevet, hvad der sker med data ved `docker-compose down` og `down -v`? [Klarhed, tillæg spm. 8; plan afsnit 7; T017, T057] — Vurdering: nej. Plan siger kun "mellem genstarter" og "ved første opstart", og `down -v` står kun som kommando i T017. Tab af nye bookinger og at `db/`-ændringer ikke indlæses i en eksisterende volume er ikke beskrevet, og T057 nævner det ikke. [Mangler]
- [ ] CHK150 - Er projektstrukturen ens? [Konsistens, constitution "Project Structure"; plan afsnit 3 og 8; T001, T059] — Vurdering: nej, `tableau/`, `extracts/` og `docs/` findes i plan og tasks, men ikke i constitution. [Gap]

---

## 8. Afleveringskrav

- [ ] CHK151 - Er spec-artefakterne navngivet som krav og klar til aflevering? [Fuldstændighed, opgave s. 5; spec NFR-08] — Vurdering: delvist. NFR-08 siger kun "required artifacts". Sync Impact Report er forældet og mærket "Fjern før commit", spec.md starter med en løs linje "Specify:", og `Specify.md.txt` er en identisk kopi. [Gap]
- [ ] CHK152 - Har alle user stories format og acceptkriterier (INVEST)? [Målbarhed, constitution "User Stories"; spec afsnit 5] — Vurdering: ja for US-01 til US-16, tidligere CHK054 er stort set løst. Testbarheden svækkes af AC-07.5, AC-09.4, AC-11.4 og AC-16.4, stories er på engelsk over for constitutions danske format, og FR-06 og FR-10 mangler egne stories. US-13 er meget bred. [Gap]
- [ ] CHK153 - Er README med arkitekturdiagram, CONTRIBUTE.md og Swagger UI i egen container dækket? [Dækning, constitution III og "Dokumentation"; plan afsnit 2 og 7; T016, T057, T058] — Vurdering: ja. T029, T048 og T055 skriver i `README.md`, før T057 opretter den. [Gap]
- [ ] CHK154 - Er oprettelse af GitHub-repository og git-arbejdsgangen dækket af en task? [Dækning, opgave s. 5; constitution "Git"; spec NFR-08; T001] — Vurdering: nej, POC-mappen er ikke et repository, og ingen task opretter det eller sætter navne for commits. Kravet om commits kan ikke opfyldes uden. [Mangler]
- [ ] CHK155 - Er resultatet af det sidste Converge-tjek dækket? [Dækning, opgave s. 4-5; spec afsnit 11; T060] — Vurdering: ja som task, men fil og format er ikke angivet. Opgaven beskriver gentagelse af implement og converge, mens T060 er ét tjek til sidst uden tid afsat. [Gap]
- [ ] CHK156 - Er kravet om, at alle 5 kan forklare koden, verificerbart? [Målbarhed, constitution "Ejerskab og AI"; spec afsnit 11 punkt 8; opgave s. 2] — Vurdering: nej, der er ingen task eller kriterium ud over review før merge, og review har heller ingen task. [Gap]

---

## 9. Præsentation

- [ ] CHK157 - Er der krav eller tasks, der forbereder den 10 minutters præsentation? [Dækning, opgave s. 6; spec afsnit 12] — Vurdering: nej. Spec har kun "can demonstrate and explain". Datoen, formatet (10 + 10 minutter) og rollen som reviewgruppe for en anden gruppe står ingen steder. [Mangler]
- [ ] CHK158 - Er live-demoen fra browser til MySQL til Tableau beskrevet? [Dækning, spec AC-05.3, AC-13.6; plan afsnit 8 "Systemtest"; T053, T055] — Vurdering: nej. Delene findes, men der er ingen task, intet forløb og ingen reserveplan. Det er ikke angivet, hvordan MySQL-trinnet vises, hvilket tal der synligt ændrer sig, eller hvordan op til 60 sekunder + reload passer ind. CHK061, CHK126 og CHK143 kan stoppe demoen. [Mangler]

Tillægsspørgsmålene (Tillæg). **Intet dokumenteret svar: spørgsmål 2 og 5.** Delvist svar: 1, 4, 6, 7, 8 og 10. Dokumenteret svar: 3 og 9.

- [ ] CHK159 - Spm. 1 Arkitekturdiagram: Har det et dokumenteret svar? [Dækning, plan Summary, afsnit 4 og 7; T057] — Vurdering: delvist, komponenter er beskrevet, men diagrammet findes kun som kommende task. [Gap]
- [ ] CHK160 - Spm. 2 Følg et request: Har det et dokumenteret svar? [Dækning, plan afsnit 1 og 4] — Vurdering: nej, der er ingen samlet trin-for-trin-beskrivelse fra klik til MySQL og tilbage, og ingen task laver den. [Mangler]
- [ ] CHK161 - Spm. 3 Tre lag: Har det et dokumenteret svar? [Dækning, constitution I; plan afsnit 4 og 5] — Vurdering: ja, inkl. sæson som eksempel, men se konflikten i CHK104.
- [ ] CHK162 - Spm. 4 Forretningslogikkens placering: Har det et dokumenteret svar? [Dækning, constitution I og VIII; plan afsnit 4 og 9] — Vurdering: delvist, placering og begrundelse findes, men ikke konsekvensen af at flytte beregningen. Opgaven siger desuden, at dashboardet "viser og beregner". [Gap]
- [ ] CHK163 - Spm. 5 Udskiftelighed: Har det et dokumenteret svar? [Dækning, plan afsnit 4; constitution VII] — Vurdering: nej, hverken udskiftning af MySQL eller af frontend med hotellets bookingsystem er beskrevet. Der er kun en sidebemærkning om dependency injection og eksterne konsumenter. [Mangler]
- [ ] CHK164 - Spm. 6 REST-design: Har det et dokumenteret svar? [Dækning, constitution II; plan afsnit 6] — Vurdering: delvist, endpoints og statuskoder findes, men ingen begrundelse for URL-valg og kobling til domænemodellen, og gæster mangler som ressource (CHK126). [Gap]
- [ ] CHK165 - Spm. 7 API-kontrakt: Har det et dokumenteret svar? [Dækning, constitution III; plan afsnit 2] — Vurdering: delvist, sikringen af overensstemmelse er beskrevet, men kontraktens "kunder" er ikke samlet (CHK134). [Gap]
- [ ] CHK166 - Spm. 8 Docker: Har det et dokumenteret svar? [Dækning, plan afsnit 7] — Vurdering: delvist, containere, servicenavne og rækkefølge findes, men ikke data ved nedlukning (CHK149). [Gap]
- [ ] CHK167 - Spm. 9 Fra statisk til live: Har det et dokumenteret svar? [Dækning, spec FR-02, C-01; plan afsnit 3 og 6] — Vurdering: ja for vejen fra API til Tableau. Vejen fra CSV til database mangler (CHK078).
- [ ] CHK168 - Spm. 10 Ejerskab og vurdering: Har det et dokumenteret svar? [Dækning, constitution "Ejerskab og AI"; spec NFR-10; T059] — Vurdering: delvist. AI-beslutninger kommer med T059, og NFR-10 nævner manglende login som "kendt svaghed", men ingen har udpeget den største svaghed ved produktion. [Gap]

---

## 10. Tidsplan

- [ ] CHK169 - Er tasks prioriteret, så skelet, booking-CRUD, nøgletal og Tableau kommer først? [Prioritering, tasks "Skæringsorden", "MVP"] — Vurdering: ja.
- [ ] CHK170 - Er T053 placeret ens i rækkefølgen? [Konsistens, tasks "Skæringsorden", "MVP", Afhængigheder Fase 8; plan "Næste skridt" 4] — Vurdering: nej, skæringsorden og MVP sætter T053 før Fase 5-7, mens afhængighederne kræver Fase 4-7 færdige. [Konflikt]
- [ ] CHK171 - Er det beskrevet, hvilke opgaver der kan skæres, hvis tiden ikke rækker? [Klarhed, spec afsnit 5; tasks "User story → fase", "Skæringsorden"] — Vurdering: nej. "Skæringsorden" er en rækkefølge. US-16 "kan skæres", men er Must have i spec og krævet af AC-13.1, og tasks siger samtidig, at alle resterende krav er afleveringskrav. Et delvist dashboard er ikke defineret. [Konflikt]
- [ ] CHK172 - Er planen knyttet til præsentationen fredag den 6. november? [Fuldstændighed, opgave s. 6; plan afsnit 9] — Vurdering: nej, datoen står ingen steder, kun "2-ugers deadline", og der er ingen milepæle. Pr. 1/11 er der 5 dage og 62 åbne tasks. [Mangler]
- [ ] CHK173 - Har alle tasks en ejer i fordelingen? [Dækning, tasks "Parallellisering"] — Vurdering: nej, T001-T017, T028-T029, T038-T042, T048-T049, T053-T056 og T060-T062 er ikke fordelt, herunder selve dashboardet. [Gap]
- [ ] CHK174 - Er alle afleveringsopgaver med i rækkefølgen? [Dækning, tasks "MVP", Afhængigheder Fase 9; T061, T062] — Vurdering: nej, T061 og T062 mangler i både MVP-liste og afhængigheder. [Gap]

---

## Prioriteret liste over de vigtigste huller

Listen beskriver, hvad der skal besluttes. Den foreslår ikke selve svarene.

### Skal afklares før implementering

1. **Hvordan bliver flade filer til databasen?** Der findes ingen leverede tabeller, datoer, værelser eller medarbejdere, så T004-T006 og hele Fase 1 kan ikke udføres som skrevet. Beslut, hvad der importeres, og hvad der er markeret demodata. (CHK078, CHK084, CHK091, CHK098, CHK099, CHK106, CHK124)
2. **`rooms.capacity` (O-15).** Betingelsen for at spørge underviseren er opfyldt nu, og kæden rammer al booking-CRUD. Spørg, og fastlæg hvad der gælder, indtil der er svar. (CHK065, CHK093-CHK095)
3. **Perioder og omsætning over grænser.** Afgør, om `end_date` tæller med, og hvordan en booking fordeles over periode, sæson og år, samt hvad "komplette data" betyder. (CHK067, CHK101, CHK107)
4. **Bardata.** Afgør, hvordan en aggregeret menu bliver til salg for Helene pr. år. (CHK119-CHK121)
5. **Sæson og kombinationer.** Afgør lagplacering og understøttelse af værelsestype × sæson, inden kontrakten skrives. (CHK102, CHK104)
6. **Tableau-kontrakten.** Definér `.hyper`-tabeller, perioder og filtre, og giv RevPAR/ADR endpoints. (CHK116, CHK117, CHK141)
7. **Booking-flowet.** Afgør, hvordan en gæst vælges eller oprettes, og hvor prisen kommer fra. Ellers kan demoen ikke gennemføres. (CHK126, CHK127)
8. **Eksport og "én kommando" (O-11).** Afgør, om eksporten kører efter `docker-compose up`, og hvordan afvigelser fra constitution godkendes, også for reservemetoden. (CHK061, CHK088, CHK138, CHK140)
9. **Kontrakt-arbejdsgangen.** Afstem samme-commit-reglen, contract-first og tidspunktet for T056, da det rammer første kontraktopgave. (CHK080, CHK131)
10. **Repository, ejere, tidsplan og skæreliste.** Opret repository, navngiv de 5, sæt nye frister efter 30/10, knyt planen til 6/11, og fastlæg hvad der reelt kan skæres. (CHK081-CHK083, CHK154, CHK170-CHK173)

### Kan afklares undervejs

Skal stadig være på plads, inden de nævnte tasks startes eller afleveres.

1. **Præsentation og demo:** skriv demoforløb og reserveplan, og dokumentér svar på spm. 2 og 5 samt den største svaghed. (CHK157, CHK158, CHK160, CHK163, CHK168)
2. **`aar` eller `year`:** før T030 og T043. (CHK090, CHK108)
3. **Svar ved tomme data og ADR ved 0 nætter:** før T035, T039 og T049. (CHK109, CHK115)
4. **Gæstetælling og landeformat:** før T034. (CHK103, CHK111, CHK112)
5. **Kundetilfredshed:** periodedato, decimaler og sletning af bookinger med rating, før T006, T019 og T039. (CHK069, CHK113, CHK114)
6. **Dobbeltbooking ved PUT, anden grænse og samtidighed:** før T021 og T023. (CHK074)
7. **Fejlformat, validator-tilstand, statuskoder og bookingliste:** før T011, T012 og T022. (CHK128-CHK130, CHK133)
8. **Docker:** `down` og `down -v`, frisk klon, "sund" og `extracts`, før T016, T017 og T057. (CHK137, CHK146, CHK148, CHK149)
9. **Eksportens robusthed og Tableau-licens:** før T051 og T054. (CHK142-CHK144)
10. **Swagger UI "Try it out":** før Fase 2-checkpoint. (CHK132)
11. **Målemetode for NFR-09:** før T062. (CHK070, CHK071)
12. **Dokumentoprydning:** forældede henvisninger, versionsnumre, Sync Impact Report, projektstruktur og overførsel af C-09. (CHK096, CHK097, CHK136, CHK150, CHK151)
13. **Converge og ejerskab:** format og gentagelse af Converge samt hvordan forklaringskravet vises. (CHK155, CHK156)

---

## Notes

- Mark items `[x]` only after review confirms the requirement-quality criterion is satisfied.
- Lad punkter stå åbne, så længe de kræver afklaring, rettelse eller vurdering fra anmelderen.
- `/speckit-implement` læser tjeklistens tilstand som gate og må ikke ændre markeringer.
- `checklists/requirements.md` har sin egen livscyklus. Den fil findes ikke i dette projekt.
- Constitution, spec, plan, tasks og `checklists/kravkvalitet.md` er ikke ændret af denne kørsel.
- Datatjekket er udført på filerne pr. 2026-11-01. Ændres datagrundlaget, skal punkterne med henvisning til hoteldata og bardata læses igen.
