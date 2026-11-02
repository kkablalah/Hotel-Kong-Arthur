# Verificerer systemet fra en ren database (T004, T005, T016, T017 og testene).
# ADVARSEL: docker-compose down -v sletter databasen, også nye bookinger.
# Kør fra projektets rod: powershell -ExecutionPolicy Bypass -File scripts\verificer.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Test-Path .env)) {
    Write-Host 'Mangler .env. Kør: Copy-Item .env.example .env' -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 1. Ren opstart ===" -ForegroundColor Cyan
docker-compose down -v
docker-compose up -d --build --wait
$startedOk = $LASTEXITCODE -eq 0
docker-compose ps
if (-not $startedOk) {
    Write-Host 'Systemet startede ikke. Se docker-compose logs db og docker-compose logs backend' -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 2. Database ===" -ForegroundColor Cyan
Get-Content scripts\kontrol.sql | docker-compose exec -T db sh -c 'mysql -t --default-character-set=utf8mb4 -uroot -p$MYSQL_ROOT_PASSWORD hotel'

Write-Host "`n=== 3. Services ===" -ForegroundColor Cyan
$nginxConfig = try { (Invoke-WebRequest -Uri 'http://localhost:3000/nginx.conf' -UseBasicParsing).StatusCode } catch { [int]$_.Exception.Response.StatusCode }
Write-Host "$nginxConfig  http://localhost:3000/nginx.conf (forventet 404)"
foreach ($url in 'http://localhost:8000/health', 'http://localhost:8000/api/rooms', 'http://localhost:3000/', 'http://localhost:3000/api/rooms', 'http://localhost:8080/') {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        Write-Host ("{0}  {1}" -f $response.StatusCode, $url)
    } catch {
        Write-Host ("FEJL  {0}: {1}" -f $url, $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host "`nÅrets indtjening (forventet 11234034.00):"
(Invoke-WebRequest -Uri 'http://localhost:8000/api/metrics/revenue/annual?aar=2025' -UseBasicParsing).Content

Write-Host "`n=== 4. Tests mod MySQL ===" -ForegroundColor Cyan
docker-compose exec -T backend npm test

Write-Host "`n=== 5. Tableau-eksport ===" -ForegroundColor Cyan
docker-compose ps tableau-export
docker-compose logs --tail=3 tableau-export
docker-compose run --rm tableau-export python hyper_extract.py --once
Get-Item extracts\tableau_data.hyper -ErrorAction SilentlyContinue | Select-Object Name, Length, LastWriteTime | Format-List
