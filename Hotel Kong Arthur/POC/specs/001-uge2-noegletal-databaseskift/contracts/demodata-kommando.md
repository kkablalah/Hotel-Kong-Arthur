# Kontrakt: demodata-kommandoen

Køres fra projektets rod, når systemet kører.

```text
powershell -ExecutionPolicy Bypass -File scripts\demodata.ps1 -Indlaes
powershell -ExecutionPolicy Bypass -File scripts\demodata.ps1 -Fjern
```

Præcis ét af de to valg skal angives.

## `-Indlaes`

| Situation | Adfærd | Exitkode |
|---|---|---|
| Systemet svarer ikke | Skriver, at systemet skal startes | 1 |
| `HISTORIK_AAR` er indeværende år | Afviser, fordi det ville ændre årets indtjening for de historiske data | 1 |
| Der findes bookinger med `DEMO-DATA` | Skriver, at datasættet er indlæst, og opretter intet. Beder om `-Fjern`, hvis det er ufuldstændigt | 0 |
| Normal kørsel | Opretter bookinger og ratings og skriver antal oprettede og oversprungne, belagte nætter og krav | 0 |
| 409 på en række | Rækken og dens rating springes over og tælles | Påvirker ikke |
| Anden fejl på en række | Stopper og beder om `-Fjern` | 1 |
| Under kravet efter kørsel (782 eller 784 nætter) | Skriver, at SC-013 ikke er nået | 1 |

## `-Fjern`

| Situation | Adfærd | Exitkode |
|---|---|---|
| Systemet svarer ikke | Skriver, at systemet skal startes | 1 |
| Der findes demo-bookinger | Sletter dem gennem API'et og skriver antallet. Ratings slettes sammen med bookingerne | 0 |
| Der findes ingen | Skriver, at der ikke er noget at fjerne | 0 |

## Regler

- Alle ændringer går gennem REST API'et, så bookingreglerne gælder (FR-027).
- `scripts/demodata.sql` må kun indeholde en `SELECT` og må ikke skrive data.
- Scriptet må kun slette bookinger med efternavnet `DEMO-DATA`.
- Scriptet indlæses aldrig af `docker-compose up` og ligger derfor ikke i `db/` (FR-026).
