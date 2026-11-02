# Contribute

## Arbejdsgang

Følg spec-kit-rækkefølgen i `Feature/`: Constitution → Specify → Clarify → Plan → Tasks → Implement → Converge.

1. Opdatér krav og acceptkriterier før implementering.
2. Implementér små, afgrænsede ændringer i det relevante arkitekturlag.
3. Opdatér OpenAPI-kontrakten sammen med API-ændringer.
4. Kontrollér brugerflow og dokumentation i Converge.

## Lokal validering

```sh
docker compose config
docker compose up --build
```

Kontrollér derefter dashboardet på `http://localhost:8080`, Swagger UI på `http://localhost:8080/api-docs` og backendens `/health`-endpoint.

## Datakontrakter

- Datoer sendes som `YYYY-MM-DD`.
- Alle endpoints under `/api` bruger JSON.
- Bookingpris og barsalgspriser er i DKK.
- Nøgletal og begrænsninger skal dokumenteres i `Feature/Clarify.md` og `Feature/Implement.md`.
