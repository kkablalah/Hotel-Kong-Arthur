<!--
Sync Impact Report (Fjern før commit):
- Version change: 1.1.0 → 2.0.0 (MAJOR: MySQL-kravet er fjernet, og princip IV er omdefineret)
- Modified principles: IV. Database (MySQL erstattet af krav om en anden databasetype og isolering af databasen)
- Added principles: X. Nøgletal og dataanalyse via API
- Consequential edit: "Lodrette Dele" siger nu "database" i stedet for "MySQL"
- Removed sections: Ingen
- Unchanged: Alle øvrige principper og afsnit
- Follow-up TODOs:
  - Hele gruppen skal godkende ændringen (Governance)
  - Vælg og begrund databasen i plan.md
  - spec.md, plan.md og tasks.md er i konflikt med IV og X og er ikke rettet endnu
-->

# Hotel Kong Arthur dataanalyse-platform Constitution

## Core Principles

### I. 3-Lags Arkitektur
Backend skal bestå af præsentationslag (REST API), forretningslogiklag og dataadgangslag. Afhængigheder skal kun gå nedad (præsentation → forretningslogik → data). SQL-forekomster og databaseforbindelser skal kun findes i dataadgangslaget. Forretningsregler og nøgletalsberegninger må ikke placeres i controllere eller SQL-views, der erstatter logiklaget.

### II. REST/JSON API
Præsentationslaget skal leverer et REST API med JSON. Ressourcer skal navngives med substantiver. Korrekte HTTP-metoder og statuskoder skal bruges (fx 201 Created, 400 Bad Request, 404 Not Found).

### III. OpenAPI-kontrakt
API'et skal beskrives i en OpenAPI-specifikation. Swagger UI skal være tilgængelig og køre i en Docker-container. OpenAPI-specifikationen og implementeringen skal altid stemme overens. Enhver API-ændring skal opdatere kontrakten i samme commit.

### IV. Database
Systemet skal bruge en anden databasetype end MySQL. Det konkrete valg og begrundelsen skal fastlægges i `plan.md`. Schema og startdata skal ligge i `db/` og indlæses automatisk ved første opstart.

I applikationskoden må kun dataadgangslaget (`backend/src/data`) og `db/`-mappen kende til databasen. Et skift af database må ikke kræve ændringer i præsentationslaget eller forretningslogiklaget. Uden for applikationskoden må `docker-compose.yml` og `.env`-filerne definere databasens container og forbindelse (princip V og VI), og tests og kontrolscripts må køre kontrolberegninger direkte mod databasen ("Kvalitet og Test").

### V. Docker
Alt skal køre i Docker-containere og startes med én kommando: `docker-compose up`. Databasen skal være sund, før backenden starter. Data skal bevares mellem genstarter via volumes.

### VI. Konfiguration
Indstillinger og hemmeligheder skal ligge i miljøvariabler. `.env` må ikke ligge i git. `.env.example` skal ligge i git. Ingen hårdkodede adgangskoder, API-nøgler eller forbundelsesstrenge.

### VII. Frontend
Der skal være en simpel browser-frontend i ren HTML, CSS og JavaScript uden framework. Frontenden skal kunne oprette, rette og slette bookinger via backendens API. Hotellets eksisterende bookingsystem skal kunne bruge API'et (POST/PUT/DELETE).

### VIII. Analytics
Der skal være et interaktivt Tableau-dashboard, der viser nøgletallene. Dashboardet skal hente data via backendens REST API. Nøgletal skal beregnes i backenden, ikke i Tableau.

### IX. Programmeringssprog
Ét sprog og framework skal bruges til hele backenden. Sproget skal kunne udstille en OpenAPI-specifikation og køre i Docker. Valget af sprog og framework skal begrundes i Plan-trinnet.

**Begrundet undtagelse (godkendt af gruppen 2026-10-29):** Tableau-eksportscriptet i `tableau/` må anvende Python med Tableau Hyper API. Hyper API findes ikke til Node.js/JavaScript, og alternativerne (Java/C++) er sværere for gruppen. Scriptet er et eksternt værktøj i egen Docker-container og ikke en del af backenden: det må kun hente data fra backendens REST API og skrive `.hyper`-filen — ingen forretningslogik eller databaseadgang i scriptet.

### X. Nøgletal og dataanalyse via API
Alle nøgletal og dataanalyser skal beregnes i backenden og stilles til rådighed som REST/JSON-endpoints, der er beskrevet i OpenAPI-kontrakten. Frontenden skal hente og vise dem fra REST API'et. Frontenden må hverken beregne dem selv eller tale direkte med databasen. Tableau-dashboardet (princip VIII) forbliver en ekstra visning, der får data via REST API'et og `.hyper`-scriptet (princip IX), og det erstatter ikke visningen i frontenden.

## Development Principles

### Spec-drevet Udvikling
Specifikationen skal skrives før koden. Ændrede krav skal opdateres i specifikationen først. Teamet skal følge arbejdsprocessen: Constitution → Specify → Clarify → Plan → Tasks → Implement → Converge.

### Lodrette Dele
Teamet skal først bygge et minimalt skelet, der virker hele vejen (docker-compose, backend, database og ét endpoint). Derefter udvides systemet ét user story ad gangen. Én task implementeres ad gangen.

### User Stories
User stories skal skrives som "Som <rolle> ønsker jeg <mål>, så <formål>". User stories skal følge INVEST-principperne (Uafhængig, Forhandlbar, Værdifuld, Estimérbar, Tilstrækkelig, Testbar). User stories skal have acceptkriterier, der afgør, om en story er færdig.

### Kvalitet og Test
Nøgletal skal kontrolleres mod kontrolberegninger i databasen. Vigtige beregninger (fx belægningsgrad og indtjening) skal have tests, der validerer korrektheden.

### Ejerskab og AI
AI må bruges til hele opgaven, men alle 5 gruppemedlemmer skal kunne forklare og vurdere koden. Kode, som ingen i gruppen kan forklare, må ikke accepteres. Vigtige arkitekturbeslutninger, som AI'en foreslår, skal noteres med begrundelse for, om vi beholdt eller ændrede dem.

### Git
Alle 5 i gruppen skal committe under eget navn. Commits skal være små og have meningsfulde beskeder. Der skal arbejdes i feature-branches. Mindst ét andet gruppemedlem skal gennemgå koden før merge til main. Main-branchen skal altid kunne starte med `docker-compose up`.

### Dokumentation
README.md med arkitekturdiagram, CONTRIBUTE.md og Swagger UI skal holdes opdateret løbende.

## Project Structure

```
backend/
  src/
    presentation/
    business/
    data/
db/
frontend/
openapi/
specs/
docker-compose.yml
.env.example
README.md
CONTRIBUTE.md
```

## Definition of Done

En opgave er færdig, når:
- Koden opfylder acceptkriterierne
- Koden følger 3-lags arkitekturen
- OpenAPI-specifikationen er opdateret
- Systemet starter med `docker-compose up` fra en ren opstart
- Koden er gennemgået af mindst ét andet gruppemedlem

## Governance

Forfatningen gælder for hele projektet og supersederer alle andre dokumenter og praksisser. Ændringer til forfatningen skal dokumenteres, godkendes af hele gruppen og noteres med en klar begrundelse. Alle gruppemedlemmer skal kunne forklare og stå inde for forfatningens principper. Ved konflikter mellem forfatningen og andre dokumenter, gælder forfatningen.

**Version**: 2.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-02 (hotellets tillægsopgave uge 2: princip IV kræver en anden database end MySQL og isolerer databasen i data-laget og `db/`; nyt princip X om nøgletal via API og visning i frontenden)
