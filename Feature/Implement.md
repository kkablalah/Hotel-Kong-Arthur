# Converge: Booking-POC

Gentaget 2026-10-27 efter færdiggørelse af T2 og T4. Gennemgået mod `specs/Specify`, `specs/Plan`, `specs/Tasks` og beslutningerne i `Feature/Clarify.md`.

## Hvad virker

- **Browserens bookingflow:** Brugeren har bekræftet, at oprettelse, visning, redigering og sletning virker i browseren. Redigeringen vises fortsat efter genindlæsning.
- **Redigeringsfejlen:** Redigeringsrækken blev tidligere sat ind efter `tr`, før `tr` var føjet til DOM'en. Den blev derfor ikke vist. Frontendkoden er rettet, og frontend-containeren er genbygget.
- **Backend og MySQL:** Gyldig POST opretter booking; gyldig PUT erstatter hele bookingens feltsæt; efterfølgende GET viser gemte værdier. Validering køres før SQL-ændringer.
- **Validering:** POST og PUT afviser manglende/tomt navn, ugyldig e-mail, værelsesnummer 0 eller decimal, datoer med forkert format eller ugyldig kalenderdato, check-out før eller lig check-in samt ugyldig status. Fejlsvaret er HTTP 400 med en forståelig JSON-besked i `error`.
- **Ukendte ID'er:** GET, PUT og DELETE returnerer HTTP 404, når ID'et ikke findes.
- **OpenAPI og Swagger UI:** Swagger UI svarer HTTP 200. Det indlæste dokument indeholder `BookingCreateInput`, `BookingUpdateInput`, `ValidationError` og `NotFound` og beskriver fuld PUT-erstatning.
- **Opstart og persistens:** `docker compose -f compose.yaml up --build -d` starter MySQL, backend og frontend. Persistens er verificeret ved at hente en særskilt booking efter genstart af MySQL-containeren.
- **Testdata:** Alle egne testbookinger er slettet bagefter. API og MySQL bekræftede, at de ikke ligger tilbage. Ingen eksisterende bookinger eller volumener blev slettet.
- **Docker-detalje:** Værtens port 3306 var optaget. MySQL er derfor kun tilgængelig internt på Compose-netværket; backend forbinder via servicenavnet `mysql`.

## Kontroller og resultater

Agentens integrationstest blev kørt mod API'et gennem Nginx på `http://localhost:8080/api/bookings`:

| Kontrol | Forventet | Resultat |
|---|---:|---|
| Gyldig POST uden status | 201; standardstatus `confirmed` | Bestået |
| Gyldig PUT med alle felter | 200 og opdaterede værdier | Bestået |
| Manglende/tomt `guestName` ved POST og PUT | 400; ingen ændring | Bestået |
| Ugyldig e-mail ved POST og PUT | 400; ingen ændring | Bestået |
| `roomNumber` 0 eller decimal ved POST og PUT | 400; ingen ændring | Bestået |
| Ugyldig/forkert formateret dato eller check-out før/lig check-in | 400; ingen ændring | Bestået |
| Ugyldig status ved POST og PUT | 400; ingen ændring | Bestået |
| Efter ugyldige PUT: hent booking igen | Samme værdier som før | Bestået |
| GET/PUT/DELETE med ukendt ID | 404 | Bestået |
| Swagger UI og indlæst OpenAPI-dokument | UI svarer, nye input- og fejlsvarsskemaer er indlæst | Bestået |
| Frontend, API og backend healthcheck | HTTP 200 / healthy | Bestået |

En gyldig testbooking ID 10 blev oprettet, opdateret og derefter slettet. De ugyldige POST-forsøg oprettede ingen ekstra rækker; de ugyldige PUT-forsøg ændrede ikke testbookingens værdier. Efter oprydning viste API og SQL nul egne testrækker.

## Hvad er testet af hvem

- **Brugerens browserkontrol:** Opret, vis, ret og slet virker i browseren; rettelsen overlever genindlæsning.
- **Agentens API-/MySQL-kontrol:** Gyldige og ugyldige POST/PUT, uændrede MySQL-værdier ved afvisning, ukendte ID'er, oprydning af testbooking og Swagger UI-kontrakt.
- Agenten automatiserede ikke browserklik. Browserresultatet ovenfor er brugerens bekræftelse; backendresultaterne er målt separat via HTTP og MySQL.

## Resterende scope fra den samlede specifikation

Booking-POC'en indeholder ikke hotellets belægnings- og omsætningsanalyser, barstatistik, ekstra forretningsmål eller Tableau-dashboard. De krav står stadig i `specs/Specify`, men ligger uden for den afgrænsede booking-POC. Der er ikke andre åbne punkter i T2 eller T4.

## Sådan demonstreres booking-POC'en til eksamen

1. Start Docker Desktop, og kør fra projektroden:

   ```sh
   docker compose -f compose.yaml up --build -d
   ```

2. Åbn <http://localhost:8080>. Vis bookinglisten, opret en booking med tydeligt demonavn, og vis at den kommer på listen.
3. Vælg **Rediger**, ret gæstens navn eller datoer, gem, og genindlæs siden for at vise, at værdierne er bevaret.
4. Vis API-dokumentationen på <http://localhost:8080/api-docs/>. Fremhæv POST, GET, PUT og DELETE samt at PUT sender hele bookingens feltsæt.
5. Vis validering med en ugyldig e-mail eller check-out-dato i API-kaldet: svaret er HTTP 400 med `error`, og bookingen forbliver uændret. En gyldig opdatering returnerer HTTP 200.
6. Slet demobookingen og vis, at den ikke længere står i listen.

Stop tjenesterne uden at fjerne data med `docker compose -f compose.yaml down`. Brug ikke `down -v`, hvis MySQL-data skal bevares.
