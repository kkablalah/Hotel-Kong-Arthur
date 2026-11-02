# Implement og Converge

## Implementeret i POC

- Tre-lags Express/MySQL-arkitektur med OpenAPI og Swagger UI.
- Booking-CRUD med validering af datoer, pris og overlappende værelser.
- KPI-API for bookingantal, værelsesindtægt og belægning ud fra 214 værelser.
- Historiske sæson- og værelsestypeaggregater fra de 1.000 ophold uden at udlede kalenderbaseret belægning.
- Cocktail- og kaffemenu seedet fra `drinks_menu_with_sales.xlsx`.
- Tidsstemplede barsalg og gæstefeedback gemmes i MySQL.
- Browserdashboard med valg af periode, salgsmix, registreringsformularer og 15-sekunders opdatering.
- Docker Compose med Nginx reverse proxy til API og Swagger UI.

## Converge-tjek

| Kriterium | Resultat |
|---|---|
| REST/JSON, 3-lagsarkitektur og MySQL | Implementeret |
| OpenAPI-kontrakt og Swagger UI | Implementeret |
| Booking-CRUD fra browseren | Implementeret |
| Belægning og værelsesindtægt | Implementeret; indtægt er estimeret fra bookingpris |
| Historisk sæsonomsætning | Implementeret fra 1.000 ophold; historik holdes adskilt fra live-belægning |
| Live barsalg og gæstefeedback | Implementeret via API; dashboard henter data hvert 15. sekund |
| Cocktail-/kaffefordeling | Implementeret; baseline er historisk og ikke medarbejderspecifik |
| Tableau-workbook | Mangler; POC-dashboardet er browserbaseret |
| Rigtige live-integrationer og historiske tilfredshedsdata | Mangler; kildedata indeholder ikke nødvendige tidsstempler/vurderinger |
| Validering i Docker-miljø | Bestået: Compose-konfiguration, container-build, health, Swagger, CRUD, validering og analytics-smoketest |

## Begrænsninger

En bookingindtægt er beregnet ud fra registreret værelsespris og overnatninger; den dokumenterer ikke betaling. Den historiske barfil indeholder summer uden tidsstempler. POC'en er ikke produktionsklar og har ikke brugerlogin, rollebaseret adgang eller ekstern datakildeintegration.