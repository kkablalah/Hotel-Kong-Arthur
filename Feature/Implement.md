# Implement og Converge

## Implementeret i POC

- Tre-lags Express/SQLite-arkitektur med OpenAPI og Swagger UI.
- Booking-CRUD med validering af datoer, pris og overlappende værelser.
- KPI-API for bookingantal, værelsesindtægt og belægning ud fra 214 værelser.
- Historiske sæson- og værelsestypeaggregater fra de 1.000 ophold uden at udlede kalenderbaseret belægning.
- Cocktail- og kaffemenu seedet fra `drinks_menu_with_sales.xlsx`.
- Tidsstemplede barsalg og gæstefeedback gemmes i SQLite.
- Separate API-endpoints beregner belægning, indtjening, tilfredshed og barsalg; dashboardet læser disse endpoints.
- Cocktail-/kaffefordeling viser Helene Christines live-andel separat fra medarbejderneutral historik.
- Browserdashboard med valg af periode, salgsmix, registreringsformularer og 15-sekunders opdatering.
- Docker Compose med Nginx reverse proxy til API og Swagger UI.
- SQLite erstatter MySQL; databasefilen ligger i et vedvarende Compose-volume.

## Converge-tjek

| Kriterium | Resultat |
|---|---|
| REST/JSON, 3-lagsarkitektur og SQLite | Implementeret |
| Separate analyseendpoints i OpenAPI | Implementeret og smoke-testet |
| Browserdashboard læser beregninger fra analyse-API | Implementeret og kontrolleret |
| Helene-procentfordeling adskilt fra historisk baseline | Implementeret |
| SQLite bevarer data ved backend-genstart | Verificeret |
| OpenAPI-kontrakt og Swagger UI | Implementeret |
| Booking-CRUD fra browseren | Implementeret |
| Belægning og værelsesindtægt | Implementeret; indtægt er estimeret fra bookingpris |
| Historisk sæsonomsætning | Implementeret fra 1.000 ophold; historik holdes adskilt fra live-belægning |
| Live barsalg og gæstefeedback | Implementeret via API; dashboard henter data hvert 15. sekund |
| Cocktail-/kaffefordeling | Implementeret; baseline er historisk og ikke medarbejderspecifik |
| Tableau-workbook | Mangler; POC-dashboardet er browserbaseret |
| Rigtige live-integrationer og historiske tilfredshedsdata | Mangler; kildedata indeholder ikke nødvendige tidsstempler/vurderinger |
| Validering i Docker-miljø | Bestået: Compose-konfiguration, container-build, health, Swagger, CRUD, validering, analyseendpoints og SQLite-persistens |

## Begrænsninger

En bookingindtægt er beregnet ud fra registreret værelsespris og overnatninger; den dokumenterer ikke betaling. Den historiske barfil indeholder summer uden tidsstempler. POC'en er ikke produktionsklar og har ikke brugerlogin, rollebaseret adgang eller ekstern datakildeintegration.

Den nye SQLite-database importerer ikke automatisk poster fra den tidligere MySQL-volume. Den tidligere implementering er bevaret i Git-commit `9bf07a9`.