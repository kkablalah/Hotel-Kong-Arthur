# Hotel Kong Arthur — booking-POC

Denne delingskopi indeholder booking-POC'ens kode, specifikationer og Docker-opsætning. Historiske regneark, lokale miljøfiler og databasefiler er ikke medtaget. `mysql/init.sql` er et initieringsscript med skema og eksempelbookinger, ikke en database-dump.

## Første opstart

Forudsætning: Docker Desktop er startet.

1. Kopiér `.env.example` til `.env`.
2. Angiv lokale værdier for `MYSQL_ROOT_PASSWORD` og `MYSQL_PASSWORD` i `.env`. Brug egne adgangskoder; ingen adgangskoder følger med i denne delingskopi.
3. Kør fra delingsmappen:

   ```sh
   docker compose -f compose.yaml up --build -d
   ```

Åbn:

- Bookingbrugerflade: <http://localhost:8080>
- Swagger UI: <http://localhost:8080/api-docs/>
- Booking-API: <http://localhost:3000/api/bookings>
- Backend healthcheck: <http://localhost:3000/health>

Se status med `docker compose -f compose.yaml ps`.

## Data og stop

MySQL gemmer bookinger i en navngiven Docker-volumen. Stop med `docker compose -f compose.yaml down`; det bevarer volumen. Brug ikke `down -v`, hvis data skal bevares.

## Indhold

- `backend/`: Node.js/Express REST API, bookingservice og OpenAPI-kontrakt.
- `frontend/`: HTML, CSS, JavaScript og Nginx-konfiguration.
- `mysql/init.sql`: MySQL-skema og små eksempelbookinger til første opstart.
- `specs/` og `Feature/`: specifikation, Clarify, plan, tasks og Converge-resultat.
- `.env.example`: navne på de miljøvariabler, som skal udfyldes lokalt.
