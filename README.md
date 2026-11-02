# Hotel Kong Arthur – drifts-POC

En prototype til bookinghåndtering og driftsanalyse med Express, MySQL, OpenAPI, Swagger UI og et browserdashboard.

## Start

Fra projektets rod:

```sh
docker compose up --build
```

- Dashboard og booking-CRUD: http://localhost:8080
- Swagger UI: http://localhost:8080/api-docs
- Backend health check: http://localhost:3000/health

Compose starter MySQL, backend og Nginx-frontend. Nginx videresender `/api` og `/api-docs` til backend. MySQL-porten er kun eksponeret internt i Compose-netværket.

## Arkitektur

```text
┌──────────────────────┐
│ Browser              │
│ Dashboard + bookings │
└──────────┬───────────┘
           │ HTTP :8080
┌──────────▼───────────┐
│ Frontend: Nginx      │── /api, /api-docs ─────────┐
│ HTML + reverse proxy │                             │
└──────────────────────┘                             ▼
                                        ┌────────────────────────┐
                                        │ Backend: Express :3000 │
                                        │ Routes → Services → DB │
                                        └───────────┬────────────┘
                                                    │ MySQL protocol
                                        ┌───────────▼────────────┐
                                        │ MySQL 8                │
                                        │ Compose volume         │
                                        └────────────────────────┘
```

Backendens tre lag er REST-ruter (`backend/src/routes`), forretningslogik (`backend/src/services`) og dataadgang (`backend/src/db.js`).

## POC-funktioner

- Booking CRUD med dato-, pris- og overlapvalidering.
- KPI'er for belægning, antal bookinger, værelsesindtægt og gæstetilfredshed.
- Cocktail-/kaffefordeling med de 20 cocktails og 10 kaffetyper fra `Datasets/drinks_menu_with_sales.xlsx`.
- Historisk opholdsomsætning efter sæson og værelsestype fra `Datasets/international_names_with_rooms_1000.xlsx`.
- Registrering af nye barsalg og feedback i MySQL; dashboardet opdateres automatisk hvert 15. sekund.
- OpenAPI-kontrakten ligger i `backend/openapi.yaml`.

## API-oversigt

| Metode | Endpoint | Formål |
|---|---|---|
| GET / POST | `/api/bookings` | Liste og opret bookinger |
| GET / PUT / DELETE | `/api/bookings/{id}` | Læs, rediger og slet booking |
| GET | `/api/analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD` | Nøgletal for perioden |
| GET | `/api/bar-menu` | Cocktail- og kaffemenu |
| POST | `/api/bar-sales` | Registrer nyt salg |
| POST | `/api/feedback` | Registrer gæstevurdering fra 1 til 5 |

Se alle felter og svarformater i Swagger UI.

## Målinger og antagelser

- Hotellet modelleres med 214 værelser. Belægning er optagne værelsesnætter divideret med `214 × antal dage`; datofilteret er inklusivt, mens udtjekningsdatoen ikke er en overnatning.
- Værelsesindtægt er beregnet som bookingens pris pr. nat gange antal overlappende nætter. Det er ikke bevis for betaling.
- Annullerede bookinger tæller ikke med.
- Barregnearket indeholder historiske samlede salgstal uden tidspunkt eller medarbejder. De vises som baseline og kan ikke tilskrives Helene Christine. Nye dashboard-salg tilskrives Helene Christine.
- Kildedata indeholder ikke kundetilfredshed; KPI'en beregnes først, når feedback indsendes.
- Historikfilens sæsonposter har ingen kalenderdatoer. De bruges til sæson- og værelsestypeomsætning, ikke til live-belægning. Feltet `Days Rented` bruges ikke som kalenderbaseret belægningsmål.
- Opgaven efterspørger også et Tableau-dashboard. POC'en leverer et browserdashboard; Tableau-workbook/publicering mangler og kræver afklaring af Tableau-platform.

## Data og nulstilling

MySQL-data bevares i Docker-volumen `mysql_data`. Skemaet til analytics oprettes ved backendstart, og eksisterende bookingskema migreres idempotent med kolonnen `nightly_rate`.

For at starte helt forfra og slette alle lokale POC-data kan volumen fjernes med:

```sh
docker compose down -v
docker compose up --build
```

`down -v` sletter bookinger, registrerede barsalg og feedback i den lokale database.

## Spec-drevet udvikling

Opgavens beslutninger, user stories, plan, tasks og Converge-resultat ligger i `Feature/`. Se [CONTRIBUTE.md](./CONTRIBUTE.md) for arbejdsgang og validering.
