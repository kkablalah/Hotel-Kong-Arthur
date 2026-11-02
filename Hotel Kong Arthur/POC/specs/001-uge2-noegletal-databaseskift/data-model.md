# Data Model: Tillægsopgave uge 2

**Ingen ændringer i tabeller eller kolonner i forhold til den konverterede `db/`.** Denne fil beskriver de regler, planen bygger på.

## Tabeller

| Tabel | Rækker ved ren opstart | Id | Bemærkning |
|---|---|---|---|
| `countries` | 20 | Faste id'er, sekvens sat bagefter | |
| `drink_categories` | 2 | Faste id'er, sekvens sat bagefter | Cocktail, Coffee |
| `drinks` | 30 | Faste id'er, sekvens sat bagefter | `price_dkk numeric(8,2)` |
| `room_types` | 8 | Faste id'er, sekvens sat bagefter | |
| `stays` | 1000 | Faste id'er, sekvens sat bagefter | `price numeric(12,2)`, ingen datoer |
| `rooms` | 214 | Fra sekvensen | Antagelse, se `db/04_rooms_seed.sql` |
| `bookings` | 0 | Fra sekvensen | `total_price numeric(12,2)` |
| `customer_satisfaction` | 0 | Fra sekvensen | Slettes sammen med bookingen |

Views: `drink_sales` og `stays_detailed`.

## Grænser for input (FR-021)

| Felt | Regel | Eksempel, der afvises | Eksempel, der accepteres |
|---|---|---|---|
| Id i stien, `room_id`, `country_id` | Heltal, 1 til 2.147.483.647 | 2.147.483.648 | 2.147.483.647 (404 eller 400, hvis det ikke findes, som i version 1) |
| `check_in_date`, `check_out_date`, `start_date`, `end_date` | Datoen skal findes, og året må ikke være 0000 | `2026-02-30`, `2026-02-29`, `0000-01-01` | `2028-02-29` |
| `first_name`, `family_name`, `comment` | Ingen nulbytes | `a\u0000b` | `Müller` |
| `total_price` | Over 0 og højst 9.999.999.999,99 | 9.999.999.999,995 og 10.000.000.000 | 9.999.999.999,99 |

## Demo-datasæt

Er ikke en del af startdata og findes kun, når kommandoen er kørt. Reglerne står i [plan.md](plan.md), afsnit 5.

| Felt | Værdi |
|---|---|
| `bookings.first_name` | `Demo` |
| `bookings.family_name` | `DEMO-DATA`, som er mærkningen |
| `bookings.check_in_date`, `check_out_date` | Indeværende år, 6 nætter |
| `customer_satisfaction.rating` | 3, 4 eller 5, gennemsnit 4,00 |
| `customer_satisfaction.comment` | `Demodata` |

**Tilstande**:
- **Ikke indlæst**: Ingen bookinger med `DEMO-DATA`. Det er tilstanden efter ren opstart.
- **Indlæst**: Mindst én booking med `DEMO-DATA`. Frontenden viser "Indeholder demodata".
- **Delvist indlæst**: Indlæsningen blev afbrudt. Scriptet behandler det som indlæst og beder om `-Fjern` før en ny indlæsning.

## Kontroltal

| Tal | Værdi | Kilde |
|---|---|---|
| Ophold | 1000 | Databasen |
| Nætter | 5379 | Databasen, findes ikke i API'et |
| Værelsesindtjening | 11234034.00 DKK | Databasen og API'et |
| Baromsætning | 13448640.34 DKK | Databasen og API'et |
| Cocktails | 52,8 % af omsætningen, 34,5 % af antal solgte | API'et |
| Kaffe | 47,2 % af omsætningen, 65,5 % af antal solgte | API'et |
