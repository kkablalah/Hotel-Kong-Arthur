# Kravkvalitetstjekliste: Hotel Kong Arthur dataanalyse-platform

**Purpose**: Validerer kvaliteten af kravene (fuldstændighed, klarhed, konsistens, målbarhed, dækning) i constitution.md, spec.md (inkl. Clarifications), plan.md og tasks.md — IKKE om koden virker. Hvert punkt er et ja/nej-spørgsmål med reference til fil og afsnit/task-id.
**Created**: 2026-10-29
**Feature**: `specs/hotel-kong-arthur/spec.md` | **Plan**: `specs/hotel-kong-arthur/plan.md` | **Tasks**: `specs/hotel-kong-arthur/tasks.md` | **Constitution**: `.specify/memory/constitution.md`

**Note**: Denne tjekliste er genereret af `/speckit-checklist`. Markeringer: **Gap** (krav mangler delvist), **Uklart** (krav er tvetydigt/uafklaret), **Konflikt** (krav strides på tværs af filer), **Mangler** (krav findes slet ikke).

**Review Ownership**: Tjeklisten tilhører anmelderen. Sæt kun `[x]` når anmelderen har vurderet, at krav-kvalitetskriteriet er opfyldt. `[x]` betyder IKKE at implementeringen er færdig.

---

## 1. Åbne punkter (tasks.md "Åbne punkter" O-1 til O-14)

- [ ] CHK001 - Er det for hvert åbent punkt (O-1 til O-14) eksplicit angivet, **hvem** der træffer beslutningen (gruppen, et navngivet medlem eller underviseren)? [Fuldstændighed] — O-8/O-9/O-10/O-12 siger "gruppengodkendelse", men O-1, O-4, O-6 og O-14 har ingen beslutningsejer [Uklart, tasks.md Åbne punkter]
- [ ] CHK002 - Er de **tasks og krav**, hvert åbent punkt blokerer, angivet? [Dækning] — O-9 er eksplicit ("før T050-T052"), men fx O-2 (blokerer T044-T047 + AC-12.1-12.5), O-3 (blokerer T048-T049 + AC-13.1) og O-4 (blokerer T006/T054) er kun implicitte [Gap, tasks.md O-2, O-3, O-4]
- [ ] CHK003 - Er **konsekvensen ved manglende beslutning** dokumenteret for hvert åbent punkt (fx "without O-2 the distribution metric cannot be tested"? [Fuldstændighed] — ingen af punkterne O-1-O-14 beskriver konsekvensen af at forblive uafklaret [Gap, tasks.md Åbne punkter]
- [ ] CHK004 - O-1 (værelsesfordeling): Er der angivet en fallback og en tidshorisont, hvis det leverede datarepository ikke kan verificeres før T005? [Klarhed] — "bruger en antaget fordeling, indtil den verificeres" uden hvem/hvornår [Uklart, tasks.md O-1, spec BR-05]
- [ ] CHK005 - O-2/O-3/O-4/O-5: Er der angivet deadline eller beslutningsmekanisme (møde, afstemning), så valgene ikke udskydes til efter de afhængige tasks? [Fuldstændighed] [Gap, tasks.md O-2, O-3, O-4, O-5]
- [ ] CHK006 - O-9 (princip IX-undtagelsen) og O-10 (reservemetoden): Er godkendelsesbetingelserne eksplicitte og bindende ("før T050-T052 implementeres" / "må ikke implementeres uden godkendelse")? [Konsistens] — ja, begge er eksplicitte [tasks.md O-9, O-10, plan.md afsnit 3.2 og 3.4]
- [ ] CHK007 - O-14 (`db/` findes ikke endnu): Er det angivet, hvem der verificerer det faktiske schema mod planens datamodel, og ved hvilken task afviklingen sker? [Klarhed] — kun "verificér når db/ oprettes" [Uklart, tasks.md O-14, plan.md afsnit 5]
- [ ] CHK008 - O-6 (belægningsantagelser): Er antagelsen (`is_active = false` tæller ikke; annulleringer = fysisk sletning) markeret som foreløbig i **spec.md** (C-05 er ikke markeret RESOLVED), eller kun i tasks? [Konsistens] — antagelsen findes kun i tasks.md, spec.md C-05 står stadig åben [Konflikt, spec.md afsnit 10 C-05 vs tasks.md O-6]

## 2. Nøgletalsdefinitioner (spec.md BR-01-08, FR-03-06, FR-14)

- [ ] CHK009 - Er belægningsgraden entydigt defineret med formel (occupied room-nights / available room-nights), periodebegreb og tællegrundlag? [Klarhed] — ja, BR-01; men cancellations/ikke-tilgængelige værelser er kun antaget (O-6) [Uklart, spec.md BR-01, tasks.md O-6]
- [ ] CHK010 - Er afrunding og tolerance for alle nøgletal anvendt ens overalt med de fastlagte værdier (0,01 DKK for beløb, 0,1 procentpoint for procenter, ROUND i kontrolforespørgsler — BR-02, AC-13.5, plan afsnit 8, tasks T037/T047/T055)? [Konsistens] — værdierne er nu kvantificeret (afgjort 2026-10-29); tjek at de er brugt konsekvent i spec, plan, tasks og kontrakt
- [ ] CHK011 - Er omsætningsdefinitionen (total booking-værdi inkl. skatter og gebyrer) fastlagt som gældende for **alle** rapporter og dashboardet? [Konsistens] — ja, BR-02 kræver konsistent brug [spec.md BR-02]
- [ ] CHK012 - Er sæsondefinitionen komplet (datoer, juleperiode, årsskifte-overgang) og identisk i spec, plan og tasks? [Konsistens] — ja, BR-03 = plan afsnit 5 = tasks T031 inkl. årsskifte [spec.md BR-03, tasks.md T031]
- [ ] CHK013 - Er kundetilfredshed defineret med formel (gennemsnit 1-5), periode, ekskluderingsregel (kun ratings knyttet til bookinger) og tom-periode-håndtering? [Klarhed] — ja, BR-08 + AC-16.4 [spec.md BR-08]
- [ ] CHK014 - Er det selvvalgte nøgletal (FR-10) defineret med formel og periode? [Fuldstændighed] — nej, kun proceskravet "dokumenteres i T048"; formel/periode mangler indtil O-3 er besluttet [Uklart, spec.md FR-10, tasks.md O-3, T048]
- [ ] CHK015 - Er håndtering af **manglende land** i omsætnings- og gæsterapporter specificeret med en navngiven kategori (fx "Ukendt") og ikke stille tildeling? [Klarhed] — AC-08.4 kræver "handled consistently... not silently assigned", men kategorien er ikke navngivet [Uklart, spec.md AC-08.4, tasks.md T034]
- [ ] CHK016 - Er hvilket kalenderår de årlige rapporter og det initiale dashboard skal dække, fastlagt? [Målbarhed] — nej, C-07/O-4 er åben; AC-09.1-09.4 kan kun testes med et valgt år [Uklart, spec.md C-07, tasks.md O-4]

## 3. Cocktailbar (spec.md FR-07-09, BR-06, BR-07)

- [ ] CHK017 - Er Helene Christines samlede salg entydigt defineret med attributionsregel (employee_id = Helene Christine) og periode (valgt år)? [Klarhed] — ja, BR-06 + FR-07 [spec.md BR-06, FR-07]
- [ ] CHK018 - Er omsætning pr. drink defineret inkl. rangordning, så "højeste omsætning" kan identificeres? [Fuldstændighed] — ja, AC-11.3 + T044/T045 (sorteret faldende) [spec.md AC-11.3, tasks.md T044-T045]
- [ ] CHK019 - Er procentfordelingen mellem cocktails og kaffe defineret med beregningsgrundlag (enheder vs. omsætning) og nævner? [Målbarhed] — nej, BR-07 udskyder valget; O-2 åben, AC-12.3/12.4 beskriver begge alternativer uden at vælge [Uklart, spec.md BR-07, tasks.md O-2]
- [ ] CHK020 - Er **datakilden** for cocktailsalg klar (leverede data vs. markeret demonstrationsdata), og er kriteriet for valget specificeret? [Fuldstændighed] — BR-06/O-7 giver reglen ("hvis leverede data mangler attribution → demodata"), men leverede data er endnu ikke verificeret, så den reelle kilde er ubekræftet [Uklart, spec.md BR-06, tasks.md O-7]

## 4. Booking (spec.md FR-01, US-01-04, BR-05)

- [ ] CHK021 - Er booking-CRUD (POST/GET/PUT/DELETE) specificeret med URL'er, statuskoder og fejlformat for alle fem endpoints? [Fuldstændighed] — ja, plan afsnit 6 + T018 [plan.md afsnit 6, tasks.md T018]
- [ ] CHK022 - Er valideringsreglerne komplet angivet (påkrævede felter, `check_in < check_out`, `total_price > 0`, værelse/gæst findes)? [Fuldstændighed] — ja, T020 [tasks.md T020]
- [ ] CHK023 - Er dobbeltbooking-reglen specificeret med præcis definition af "overlappende periode" (grænsetilfælde: samme dag ind/ud)? [Klarhed] — T019/T021 definerer reglen, men grænsetilfældet (check_out = anden bookings check_in samme dag) er ikke eksplicit specificeret [Uklart, tasks.md T019, plan.md afsnit 8]
- [ ] CHK024 - Er krav om **værelseskapacitet pr. booking** (fx maks. antal personer pr. værelse, 1-4 gæster) specificeret? [Fuldstændighed] — nej: spec nævner kun 214 værelser og ca. 428 gæster i alt (BR-05), `bookings`-tabellen har intet felt for antal gæster, og `rooms.capacity` har ingen værdikrav eller valideringsregel [Mangler, spec.md BR-05, tasks.md T004]
- [ ] CHK025 - Er 214 værelser fordelt på 8 typer fastlagt som referencedata? [Fuldstændighed] — antallet er fastlagt (T005), fordelingen er antaget indtil O-1 verificeres [Uklart, tasks.md T005, O-1]
- [ ] CHK026 - Er fejlsituationerne specificeret for alle bookings-endpoints (400 validering, 404 ukendt id, 409 dobbeltbooking, 500 uventet)? [Dækning] — ja, plan afsnit 6 + T011 (global 500-håndtering) [plan.md afsnit 6, tasks.md T011]

## 5. Live-data (spec.md FR-02, US-05, Clarifications C-01)

- [ ] CHK027 - Er "live" **målbart** defineret i spec.md (opdateringsinterval og acceptabel forsinkelse)? [Målbarhed] — nej: C-01 er ikke markeret RESOLVED, og FR-02 siger stadig "must be established during Clarify"; definitionen (per-request, ingen caching) findes kun i plan.md afsnit 6 [Konflikt, spec.md FR-02/C-01 vs plan.md afsnit 6]
- [ ] CHK028 - Er AC-05.4 ("den aftalte opdateringsinterval er dokumenteret og verificeret") foreneligt med planens per-request-definition (intet interval)? [Konsistens] — nej, AC-05.4 forudsætter et interval, som definitionen ikke har [Konflikt, spec.md AC-05.4 vs plan.md afsnit 6]
- [ ] CHK029 - Er det beskrevet, hvad der sker i **Tableau** ved dataopdatering (manuel genindlæsning af `.hyper`, intervallet, forsinkelsen)? [Dækning] — ja, plan afsnit 3.3 + T055 [plan.md afsnit 3.3, tasks.md T055]
- [ ] CHK030 - Er kravet specificeret, at nye data ikke kræver genimport af hele det historiske dataset? [Fuldstændighed] — ja, AC-05.3 [spec.md AC-05.3]

## 6. Tableau (plan.md afsnit 3, tasks.md T050-T055)

- [ ] CHK031 - Er Python-scriptet med Hyper API tydeligt markeret som **eksternt værktøj** og som begrundet undtagelse fra constitution princip IX? [Klarhed] — ja, plan afsnit 3.1-3.2 + tasks T050 + O-9 [plan.md afsnit 3.2]
- [ ] CHK032 - Er den monterede mappe (host-mount `./extracts`), outputsti (`EXTRACT_OUTPUT_PATH`) og atomisk erstatning (midlertidig fil + omdøbning) specificeret? [Fuldstændighed] — ja, plan afsnit 3.1 + T051-T052 [plan.md afsnit 3.1]
- [ ] CHK033 - Er opdateringsintervallet (`EXTRACT_SCHEDULE`) fastlagt med en værdi? [Målbarhed] — nej, O-5 er åben ("fx hver 6. time" er kun et eksempel) [Uklart, tasks.md O-5, plan.md afsnit 7]
- [ ] CHK034 - Er begrænsningerne ift. live (forsinkelse = intervallet, ingen streaming, genindlæsning i Tableau Desktop) specificeret som dokumentationskrav? [Fuldstændighed] — ja, plan afsnit 3.3 + T055 [plan.md afsnit 3.3]
- [ ] CHK035 - Er reservemetoden (direkte MySQL fra Tableau) markeret som dokumenteret **afvigelse** med betingelser (kun test/backup, read-only-bruger, gruppegodkendelse, Converge-notering, ingen task uden godkendelse)? [Konsistens] — ja, plan afsnit 3.4 + tasks O-10 [plan.md afsnit 3.4]

## 7. API og kontrakt (plan.md afsnit 2, 4, 6; tasks.md T007-T056)

- [ ] CHK036 - Er ressourcer, URL-struktur, HTTP-metoder og statuskoder specificeret for samtlige endpoints (bookings, metrics, cocktail, /health)? [Fuldstændighed] — ja, plan afsnit 6 [plan.md afsnit 6]
- [ ] CHK037 - Er fejlformatet (`error.code`, `error.message`, `error.details`) specificeret inkl. uventede fejl (500) uden interne detaljer? [Fuldstændighed] — ja, plan afsnit 6 + T011 [plan.md afsnit 6, tasks.md T011]
- [ ] CHK038 - Er metoden til at holde `openapi/openapi.yaml` og implementeringen ens beskrevet (contract-first, express-openapi-validator, kontrakttest, samme-commit-regel)? [Konsistens] — ja, plan afsnit 2 + T007/T012/T056 [plan.md afsnit 2, constitution princip III]
- [ ] CHK039 - Er dato-/tidsformatet (fx ISO 8601 `YYYY-MM-DD`) og påkrævede/valgfrie parametre specificeret for kontraktens endpoints? [Klarhed] — nej, datogrammatik er ikke eksplicit angivet og skal ellers bestemmes pr. endpoint-opgave (T007, T018, T030...) [Uklart, plan.md afsnit 6, tasks.md T007]
- [ ] CHK040 - Er koordineringspunkterne (`openapi/openapi.yaml`, `metricsService.js`, `routes/metrics.js`, `metrics.test.js`) beskrevet så de 5 gruppemedlemmer ikke skaber filkonflikter? [Konsistens] — ja: tasks.md afhængighedsafsnit angiver ejerskab (B skaber service/routes), "kontraktopgaver køres på tur, én ad gangen" og T042 efter T037 [tasks.md Afhængigheder]
- [ ] CHK041 - Er der angivet en konfliktløsningsregel, hvis to medlemmer alligevel ender i samme kontraktfil (fx commit-rækkefølge/merge-ansvar)? [Dækning] — nej, kun "på tur" uden fallback-procedure [Gap, tasks.md Afhængigheder]

## 8. Uafhængig test og Converge (tasks.md faser + T060)

- [ ] CHK042 - Har hver user story (US-01 til US-16) et **målbart** kriterium for uafhængig test i sin fase? [Målbarhed] — ja, hver fase har "Uafhængig test" med konkrete kald og forventede statuskoder; US-13 adskiller eksport og dashboard [tasks.md Fase 1-8]
- [ ] CHK043 - Er kriterierne konkrete nok til at tjekkes i Converge (verificerbare værdier, endpoints, kontrolforespørgsler)? [Målbarhed] — delvist: kriterierne er konkrete, men afhænger af uafklarede tolerancer (CHK010) og O-2/O-3/O-4 [Uklart, tasks.md T060, plan.md afsnit 8]
- [ ] CHK044 - Er kontrolforespørgsels-metoden specificeret så den matcher nøgletalsformlerne præcist (belægningsgrad = BR-01 room-nights, ikke bookinger/værelser)? [Konsistens] — ja, plan afsnit 8 (eksemplet er rettet til BR-01) [plan.md afsnit 8, spec.md BR-01]
- [ ] CHK045 - Er det specificeret, hvordan edge-cases (tom periode, gentagen beregning, manglende land) indgår i testkravene for hvert nøgletal? [Dækning] — ja, T037/T042/T047 + AC-06.4/08.4/09.4/16.4 [tasks.md T037, T042, T047]

## 9. Skelet og MVP (tasks.md Fase 1, T001-T017)

- [ ] CHK046 - Dækker T001-T017 alt, der skal til for et startbart system med `docker-compose up` (MySQL med db/-filer + automatisk indlæsning, healthcheck og start-rækkefølge, Node-backend med ét endpoint gennem alle tre lag, `/health`, Nginx-frontend der kalder endpointet, Swagger UI i egen container, verificering)? [Fuldstændighed] — ja [tasks.md Fase 1, plan.md afsnit 7]
- [ ] CHK047 - Er det specificeret, **hvordan** `db/`-SQL-filerne skal produceres (fx eksporteret fra MySQL Workbench som del af skelettet), og hvem der gør det? [Fuldstændighed] — nej: T004-T006 beskriver filernes indhold, men ingen produktionsmetode/-workflow (værktøj, eksport, validering) er angivet i plan eller tasks [Mangler, plan.md afsnit 5 og 7, tasks.md T004-T006]
- [ ] CHK048 - Er MVP-omfang og skæringsorden (P1 før P2, ingen P3-stories, dokumentation altid før aflevering) dokumenteret og forenelige med hinanden? [Konsistens] — ja, skæringsordenen og MVP-listen er afstemt (dashboard kræver Fase 5-7) [tasks.md Implementeringsstrategi]
- [ ] CHK049 - Er det et krav, at hver fase efterlades i en tilstand hvor `docker-compose up` stadig virker (constitution "Git" + "Lodrette Dele")? [Konsistens] — ja, tasks.md Inkrementel levering [tasks.md Inkrementel levering, constitution "Git"]

## 10. Ikke-funktionelle krav (spec.md afsnit 8, NFR-01-08)

- [ ] CHK050 - Er **ydeevnekrav** (svartider, last, samtidige brugere) defineret målbart — eller bevidst og eksplicit fravalgt for prototypen? [Målbarhed] — nej: spec afsnit 8 indeholder ingen ydeevnekrav, og fravalget er ikke begrundet [Mangler, spec.md afsnit 8]
- [ ] CHK051 - Er fejlhåndteringskravene målbart beskrevet (fælles fejlformat, statuskode-regler, 500 uden interne detaljer)? [Målbarhed] — ja, plan afsnit 6 + T011 + AC-14.4 [plan.md afsnit 6]
- [ ] CHK052 - Er sikkerhedskravene målbart beskrevet (hemmeligheder i miljøvariabler, ingen credentials i kode/git, parametriseret SQL mod injection, read-only-bruger ved reservemetode)? [Målbarhed] — delvist: constitution princip VI er et princip, og plan afsnit 1/3.4 nævner parametriseret SQL og read-only — men spec.md har ingen målbare sikkerhedskrav, og `.env`-håndtering testes ikke af nogen task [Gap, spec.md afsnit 8, constitution princip VI, tasks.md T002-T003]
- [ ] CHK053 - Er autentifikation bevidst og ekspist fravalgt (out of scope) i spec.md, så fraværet ikke kan tolkes som en manglende kravspecifikation? [Klarhed] — ja, spec.md afsnit 3.2 udelukker gæsteautentifikation [spec.md afsnit 3.2]

## 11. Afleveringskrav (spec.md afsnit 11, NFR-08, constitution "Git", "User Stories", "Dokumentation")

- [ ] CHK054 - Er alle user stories (US-01-US-16) skrevet i INVEST-format ("Som <rolle> ønsker jeg <mål>, så <formål>") med acceptkriterier, der afgør færdighed? [Fuldstændighed] — ja, alle 16 stories har format + AC'er; testbarheden af US-12/US-13/FR-10 afhænger dog af O-2/O-3/O-5 [Uklart, spec.md afsnit 5, constitution "User Stories"]
- [ ] CHK055 - Er kravet om spec-artefakter i GitHub-repositoriet (NFR-08) dækket, og er specs-mappen en del af det leverede? [Fuldstændighed] — ja, NFR-08 + `specs/` findes i repositoriet [spec.md NFR-08]
- [ ] CHK056 - Er README med arkitekturdiagram (T057), CONTRIBUTE.md (T058), Swagger UI i Docker-container (T016) og AI-beslutningsnoter (T059) alle dækket af tasks? [Dækning] — ja [tasks.md T057-T059, T016, spec.md NFR-05/NFR-08]
- [ ] CHK057 - Er kravet om commits fra alle 5 gruppemedlemmer under eget navn samt review før merge dækket af krav og tasks? [Dækning] — delvist: constitution "Git" kræver det og T058 (CONTRIBUTE.md) dokumenterer det, men ingen task verificerer at alle 5 faktisk har commitet (kan først tjekkes i Converge) [Gap, constitution "Git", tasks.md T058, T060]
- [ ] CHK058 - Er det afsluttende Converge-tjek (implementeret vs. mangler + checkbox-status) dækket af en task og af spec'ens Definition of Done? [Fuldstændighed] — ja, T060 + spec afsnit 11 [tasks.md T060, spec.md afsnit 11]
- [ ] CHK059 - Er constitutionens tre dokumenterede afvigelser (profil for tableau-export vs. princip V, reservemetode vs. princip VIII, Python-script vs. princip IX) angivet med **hvornår** gruppegodkendelsen skal ske (før hvilken task/milestone)? [Klarhed] — O-9 siger "før T050-T052" og O-10 "uden godkendelse", men O-11 (profil-afvigelsen) har ingen godkendelsestermin [Uklart, plan.md afsnit 10, tasks.md O-9, O-10, O-11]

## Notes

- Sæt kun `[x]` når anmelderen har bekræftet, at krav-kvalitetskriteriet er opfyldt.
- Hvis et punkt besvares "nej", marker det tilsvarende krav som **Gap** (delvist), **Uklart** (tvetydigt/uafklaret), **Konflikt** (strider mellem filer) eller **Mangler** (findes ikke) og noter det inline.
- `/speckit-implement` læser tjeklistens tilstand som gate og må ikke ændre markeringer.
- Ændringer i spec.md, plan.md eller tasks.md (fx løsning af et åbent punkt) kan gøre flere punkter opfyldte — gen-læs referencerne ved review.
- Tjeklisten tester kravenes kvalitet, ikke om koden virker: intet punkt kræver kørsel af systemet.
