# Arkitekturbeslutninger foreslået af AI

Constitution ("Ejerskab og AI") kræver, at vigtige forslag fra AI noteres med begrundelse for, om vi beholdt eller ændrede dem. **Gruppen skal gennemgå og udfylde kolonnen "Status"**, for det er jeres vurdering, ikke AI'ens. Ændringen fra Python til Node.js står i plan.md som et gruppekrav, så den er kun noteret her som baggrund.

| Forslag | Begrundelse fra AI | Status (gruppen udfylder) |
|---|---|---|
| Node.js + Express frem for Fastify | Mest udbredt og færrest skjulte mekanismer, så alle kan forklare koden | |
| `mysql2` med rå SQL frem for Knex eller ORM | Få, faste forespørgsler, og SQL er synlig i data-laget | |
| Contract-first med `express-openapi-validator` | Afvigelser mellem kontrakt og kode bliver fanget ved kørsel og i test | |
| Tableau-eksport som eksternt Python-script | Hyper API findes ikke til Node.js, og scriptet har ingen forretningslogik | |
| `tableau-export` bag en Compose-profil | Eksporten er ikke en del af driften, men det afviger fra "én kommando" | Ændret 2026-11-01: profilen er fjernet, fordi constitution V kræver én kommando |
| RevPAR med ADR som supplement | Kobler belægning og pris i ét nøgletal, som hotelbranchen kender | |
| Ratings indtastes i en formular frem for demodata | Der er ingen opfundne tal, og demoen viser, at nøgletallet ændrer sig | Beholdt af gruppen 2026-11-01 |
| Barsalg hører til samme år som opholdene | Så `?aar=` virker ens for hotel og bar | Beholdt af gruppen 2026-11-01 |
| Værelser som egen tabel (løsning B) frem for kapacitet pr. type | FR-01 og BR-10 kan bruges, som de er skrevet | Beholdt af gruppen 2026-11-01 |
