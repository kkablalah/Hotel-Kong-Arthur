# Demo: en booking fra browser til MySQL til Tableau

Forløbet tager ca. 2-3 minutter af de 10 minutters præsentation. Øv det mindst én gang på den computer, I præsenterer fra.

## Forberedelse

1. Start Docker Desktop, og kør `docker-compose up -d --wait` i god tid. Første opstart kan tage flere minutter.
2. Åbn http://localhost:3000 i browseren og PowerShell i projektmappen.
3. Åbn `tableau\dashboard\hotel_dashboard.twb`, og vis arket **Løbende indtjening**. Husk tallet.

## Forløb

| Trin | Gør | Vis og sig |
|---:|---|---|
| 1 | Opret en booking på bookingsiden med en dato, der er ledig | Frontenden kalder `POST /api/bookings` gennem Nginx |
| 2 | Opret den samme booking igen | 409 ved dobbeltbooking. Reglen ligger i business-laget (BR-10) |
| 3 | Kør `powershell -ExecutionPolicy Bypass -File scripts\vis-bookinger.ps1` | Bookingen ligger i MySQL |
| 4 | Luk Tableau, og kør `powershell -ExecutionPolicy Bypass -File scripts\eksport-nu.ps1` | Scriptet henter tallene fra REST API'et og skriver `.hyper`-filen |
| 5 | Åbn `hotel_dashboard.twb` igen | **Løbende indtjening** er steget med bookingens pris |

Sig gerne selv, hvorfor Tableau lukkes: Tableau låser filen, mens den er åben, så dashboardet er ikke real-time. API'et er derimod opdateret med det samme.

## Hvis noget går galt

| Problem | Løsning |
|---|---|
| Tallet ændrer sig ikke | Tableau var ikke helt lukket. Luk det, og kør `eksport-nu.ps1` igen |
| 409 ved første booking | Vælg en anden dato eller et andet værelse |
| Siden svarer ikke | Kør `docker-compose ps`, og se, om alle fem services kører |
| Tableau fejler helt | Vis tallet direkte: http://localhost:8000/api/metrics/revenue/running |

Rul demodata tilbage med `docker-compose down -v` og `docker-compose up -d --wait`. Det sletter alle nye bookinger og tager flere minutter, så gør det ikke lige før præsentationen.
