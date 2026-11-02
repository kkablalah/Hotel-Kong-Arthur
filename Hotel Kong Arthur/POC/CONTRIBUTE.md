# Sådan bidrager du

## Arbejdsgang

1. Hent det nyeste fra `main`, og opret en feature-branch.
2. Lav små commits under dit eget navn med en meningsfuld besked.
3. Få mindst ét andet gruppemedlem til at gennemgå koden, før den merges til `main`.
4. `main` skal altid kunne starte med `docker-compose up`.

Alle 5 i gruppen skal committe, og alle skal kunne forklare koden. Kode, som ingen i gruppen kan forklare, må ikke accepteres.

## Lagene i backenden

| Lag | Mappe | Må | Må ikke |
|---|---|---|---|
| Præsentation | `backend/src/presentation/` | HTTP, statuskoder, JSON | SQL og forretningsregler |
| Forretningslogik | `backend/src/business/` | Regler og nøgletalsberegninger | HTTP og SQL |
| Dataadgang | `backend/src/data/` | SQL med parametre | HTTP og forretningsregler |

Afhængigheder går kun nedad. SQL må ikke sammensættes med brugerinput.

## API-kontrakten

Skriv `openapi/openapi.yaml` før koden, og læg ændringer i kontrakt og kode i samme commit.

Kun ét gruppemedlem redigerer filen ad gangen:

1. Aftal det i gruppens chat.
2. Lav `git pull` før du redigerer, og hold commits små.
3. Ved merge-konflikt løser den med den senere ændring konflikten og kører hele testsuiten, før der merges.

## Tests

```powershell
docker-compose exec backend npm test
```

`backend/tests/contract.test.js` fejler, hvis kontrakt og routes ikke stemmer overens, så kontrakt og route skal være færdige i samme commit, før testene er grønne. Nøgletal kontrolleres mod SQL med tolerancen 0,01 DKK og 0,1 procentpoint.

## Hemmeligheder

`.env` må aldrig committes. Nye variabler skrives i `.env.example` med en pladsholder.

## Beslutninger

Skriv beslutninger og antagelser i `docs/beslutninger.md`, og vigtige forslag fra AI i `docs/ai-decisions.md`, med begrundelse for, om vi beholdt eller ændrede dem.
