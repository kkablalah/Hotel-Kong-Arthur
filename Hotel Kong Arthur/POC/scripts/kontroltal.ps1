# Tallene fra API'et til kontrol af dashboardets ark (T055, AC-13.5).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$api = 'http://localhost:8000/api'
$aar = (Get-Date).Year
$periode = "start_date=$aar-01-01&end_date=$aar-12-31"

function Vis($titel, $rows) {
    Write-Host "`n$titel" -ForegroundColor Cyan
    $rows | Format-Table -AutoSize | Out-String | Write-Host
}

$r = Invoke-RestMethod "$api/metrics/revenue?group_by=type"
Vis "1. Indtjening pr. værelsestype (i alt $($r.total_dkk))" ($r.rows | Select-Object group, revenue_dkk)
$r = Invoke-RestMethod "$api/metrics/revenue?group_by=type_season"
Vis "2. Indtjening pr. type og sæson (i alt $($r.total_dkk))" ($r.rows | Select-Object room_type, season, revenue_dkk)
$r = Invoke-RestMethod "$api/metrics/revenue?group_by=country"
Vis "3. Indtjening pr. land (i alt $($r.total_dkk))" ($r.rows | Select-Object group, revenue_dkk)
Vis '4. Ophold pr. land' ((Invoke-RestMethod "$api/metrics/guests/countries").rows | Select-Object country, stays_count)
Vis '5. Årets indtjening' (Invoke-RestMethod "$api/metrics/revenue/annual")
Vis '6. Løbende indtjening' (Invoke-RestMethod "$api/metrics/revenue/running")

$maaneder = 1..12 | ForEach-Object {
    $start = Get-Date -Year $aar -Month $_ -Day 1
    $slut = $start.AddMonths(1).AddDays(-1)
    $m = Invoke-RestMethod "$api/metrics/occupancy?start_date=$($start.ToString('yyyy-MM-dd'))&end_date=$($slut.ToString('yyyy-MM-dd'))"
    [pscustomobject]@{ maaned = $start.ToString('yyyy-MM'); belagte_naetter = $m.occupied_room_nights; pct = $m.occupancy_pct }
}
Vis '7. Belægning pr. måned' $maaneder

Vis "8. Kundetilfredshed $aar" (Invoke-RestMethod "$api/metrics/satisfaction?$periode" | Select-Object average_rating, rating_count)
Vis "9. RevPAR og ADR $aar" (Invoke-RestMethod "$api/metrics/revpar?$periode" | Select-Object revpar_dkk, adr_dkk, revenue_dkk, occupied_room_nights)
Vis '10. Helene Christines salg' (Invoke-RestMethod "$api/cocktail/sales")
Vis '11. Omsætning pr. drink' (Invoke-RestMethod "$api/cocktail/sales/products" | ForEach-Object { $_ } | Select-Object drink, category, revenue_dkk)
Vis '12. Cocktails og kaffe' ((Invoke-RestMethod "$api/cocktail/sales/distribution").rows | Select-Object category, revenue_share_pct, unit_share_pct)
