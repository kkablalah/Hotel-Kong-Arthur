# Noter: selvvalgt nøgletal

**RevPAR** (revenue per available room) viser, hvor meget hvert tilgængeligt værelse tjener pr. nat, uanset om det er optaget. Formålet er at se belægning og pris i ét tal, så hotellet kan vurdere, om høj belægning skyldes for lave priser.

- RevPAR = total rum-omsætning (BR-02) / (214 × nætter i perioden)
- ADR (average daily rate) = total rum-omsætning / belagte værelsesnætter (BR-01)

Begge beregnes for en valgt periode med `GET /api/metrics/revpar?start_date=&end_date=` og bygger kun på nye bookinger, fordi historiske ophold ikke har datoer. Bookingens omsætning tæller i den periode, hvor indtjekningen ligger (`docs/beslutninger.md`, B-33). `adr_dkk` er `null`, når ingen nætter er belagt.
