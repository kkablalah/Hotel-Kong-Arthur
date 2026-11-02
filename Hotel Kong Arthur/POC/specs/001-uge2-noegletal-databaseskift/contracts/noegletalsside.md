# Kontrakt: nøgletalssiden

Siden `frontend/noegletal.html` kalder kun REST API'et gennem relative stier til `/api` (FR-006, SC-006).

## Hvad der hentes

"År" og "periode" er de valgte værdier. Under "Standard" sendes de ikke til N1-N6 og N11-N13, så API'ets standard gælder. N7-N10 får indeværende år som periode.

| Kald | Beregning | "Standard" | Valgt år og periode |
|---|---|---|---|
| `GET /api/metrics/guests/countries` | N1 | Uden parametre | `start_date`, `end_date` |
| `GET /api/metrics/revenue?group_by=type_season` | N2 | Uden datoer | Med datoer |
| `GET /api/metrics/revenue?group_by=country` | N3, N5 | Uden datoer | Med datoer |
| `GET /api/metrics/revenue?group_by=type` | N4 | Uden datoer | Med datoer |
| `GET /api/metrics/revenue/annual` | N6 | Uden `aar` | `aar` |
| `GET /api/metrics/occupancy` | N7 | Indeværende år | `start_date`, `end_date` |
| `GET /api/metrics/satisfaction` | N8 | Indeværende år | `start_date`, `end_date` |
| `GET /api/metrics/revpar` | N9, N10 | Indeværende år | `start_date`, `end_date` |
| `GET /api/cocktail/sales` | N11 | Uden `aar` | `aar` |
| `GET /api/cocktail/sales/products` | N12 | Uden `aar` | `aar` |
| `GET /api/cocktail/sales/distribution` | N13 | Uden `aar` | `aar` |
| `GET /api/metrics/revenue?group_by=year` | Årsvalget | Altid | Altid |
| `GET /api/bookings` | "Indeholder demodata" | Altid | Altid |

Det er 13 kald. De sendes samtidig, så siden kan nå 5 sekunder (SC-005).

## Hvornår der hentes

Ved åbning og genindlæsning, ved et nyt valg i en dropdown og ved tryk på "Opdater". Aldrig automatisk (FR-010). Opdater bevarer valgene, mens en genindlæsning går tilbage til "Standard". Kun svarene fra den seneste hentning vises.

## Dropdowns

| Dropdown | Valgmuligheder | Regel |
|---|---|---|
| Årsvalg | "Standard", år fra API'et og indeværende år | Starter på "Standard" |
| Periodevalg | "Hele året", januar til december | Slået fra under "Standard". Går tilbage til "Hele året", når "Standard" vælges |

Periode bliver til datoer: "Hele året" er 1. januar til 31. december, og en måned er dens første til sidste dag, også 29. februar i et skudår.

## Tilstande

| Svar | Tekst |
|---|---|
| Værdi | Tallet, formateret til dansk |
| `average_rating` er `null`, eller `rating_count` er 0 | Ingen data |
| `occupied_room_nights` er 0 for N7, N9 og N10 | Ingen data |
| `adr_dkk` er `null` | Ingen data |
| 404 | Ingen data |
| Tom liste | Ingen data |
| Alle andre fejl, også netværksfejl | Kunne ikke hente tallet |

Svarer API'et 0 med `occupied_room_nights` over 0, vises tallet, fx RevPAR 0,00 DKK.

## Demodata

"Indeholder demodata" vises øverst på siden, når `GET /api/bookings` indeholder mindst én booking med `family_name` lig `DEMO-DATA`. Fejler kaldet, vises teksten "Kunne ikke afgøre, om der er demodata".

## Hvad siden ikke må

Beregne eller rette nøgletal, læse `.hyper`-filen, tale med databasen, gemme tal mellem hentninger eller have en datovælger.
