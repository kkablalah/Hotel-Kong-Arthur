# Skriver Tableau-filen med det samme. Luk Tableau først, ellers er filen låst.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
docker-compose run --rm --no-deps tableau-export python hyper_extract.py --once
