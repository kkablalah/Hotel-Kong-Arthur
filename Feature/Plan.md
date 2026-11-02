# Plan – teknisk løsning

## Arkitektur

```text
Browser
  └─ Nginx frontend (:8080)
      ├─ statisk dashboard og booking-CRUD
      └─ /api og /api-docs → Express backend (:3000)
           ├─ routes/       REST/JSON-præsentationslag
           ├─ services/     validering og nøgletalsberegning
           └─ db.js         SQLite dataadgang
                 └─ SQLite databasefil i Docker-volume
```

Docker Compose starter frontend og backend. SQLite ligger i et vedvarende volume og kræver ikke en separat databasecontainer. Swagger UI hostes af backend og viderestilles gennem Nginx, så browseren bruger én origin.

## Datamodel

- `bookings`: reservation, status, datoer og pris pr. nat.
- `drink_products`: menu, kategori, pris og aggregeret historisk baseline.
- `drink_sales`: tidsstemplede live-salg med produkt, antal og medarbejder.
- `guest_feedback`: vurdering fra 1 til 5 med valgfrit navn/kommentar.
- `historical_stays`: aggregerede ophold og omsætning pr. sæson og værelsestype fra regnearket.

## API

- `/api/bookings`: CRUD for bookinger.
- `/api/analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`: samlet analyse.
- `/api/analytics/occupancy`: belægning og bookingantal.
- `/api/analytics/revenue`: værelsesindtægt og historiske sæson-/værelsestal.
- `/api/analytics/satisfaction`: gennemsnit og vurderingsfordeling.
- `/api/analytics/bar-sales`: salgsmix og omsætning for cocktail/kaffe.
- `/api/bar-menu` og `/api/bar-sales`: menu og registrering af løbende salg.
- `/api/feedback`: indsendelse af gæstevurdering.
- `/api-docs`: Swagger UI.

Skema og historiske eksempeldata oprettes idempotent ved backendstart. Den nye SQLite-database importerer ikke automatisk tidligere data fra MySQL.