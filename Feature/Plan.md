# Plan – teknisk løsning

## Arkitektur

```text
Browser
  └─ Nginx frontend (:8080)
      ├─ statisk dashboard og booking-CRUD
      └─ /api og /api-docs → Express backend (:3000)
           ├─ routes/       REST/JSON-præsentationslag
           ├─ services/     validering og nøgletalsberegning
           └─ db.js         MySQL dataadgang
                 └─ MySQL 8 (:3306 internt)
```

Docker Compose starter frontend, backend og MySQL. Swagger UI hostes af backend og viderestilles gennem Nginx, så browseren bruger én origin.

## Datamodel

- `bookings`: reservation, status, datoer og pris pr. nat.
- `drink_products`: menu, kategori, pris og aggregeret historisk baseline.
- `drink_sales`: tidsstemplede live-salg med produkt, antal og medarbejder.
- `guest_feedback`: vurdering fra 1 til 5 med valgfrit navn/kommentar.
- `historical_stays`: aggregerede ophold og omsætning pr. sæson og værelsestype fra regnearket.

## API

- `/api/bookings`: CRUD for bookinger.
- `/api/analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`: belægning, bookingindtægt, feedback og barfordeling.
- `/api/bar-menu` og `/api/bar-sales`: menu og registrering af løbende salg.
- `/api/feedback`: indsendelse af gæstevurdering.
- `/api-docs`: Swagger UI.

Analytics-tabeller oprettes ved backendstart. En idempotent migrering tilføjer `nightly_rate` til en eksisterende bookingtabel, hvis kolonnen mangler.