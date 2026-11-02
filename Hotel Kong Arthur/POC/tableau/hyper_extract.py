"""Henter nøgletal fra backendens REST API og skriver dem til en .hyper-fil til Tableau.

Scriptet er et eksternt værktøj (constitution princip IX): ingen forretningslogik og ingen
databaseadgang. Tallene er beregnet af backenden.

Kørsel:
    python hyper_extract.py          gentager med EXPORT_INTERVAL_SECONDS
    python hyper_extract.py --once   kører én gang og stopper
"""
import os
import sys
import time
import uuid
from datetime import date
from calendar import monthrange

import requests
from tableauhyperapi import (
    Connection,
    CreateMode,
    HyperException,
    HyperProcess,
    Inserter,
    SqlType,
    TableDefinition,
    TableName,
    Telemetry,
)

API_BASE_URL = os.environ["API_BASE_URL"].rstrip("/")
OUTPUT_PATH = os.environ.get("EXTRACT_OUTPUT_PATH", "/extracts/tableau_data.hyper")
INTERVAL_SECONDS = int(os.environ.get("EXPORT_INTERVAL_SECONDS", "60"))
REQUEST_TIMEOUT_SECONDS = 10

# Kolonner for tabeller, der kan være tomme. Svarer til Booking i openapi.yaml.
EMPTY_TABLE_COLUMNS = {
    "bookings": [
        "booking_id", "room_id", "first_name", "family_name", "country_id", "guest_count",
        "check_in_date", "check_out_date", "total_price", "created_at", "updated_at",
    ],
}


def fetch(path):
    """Henter JSON. Returnerer None, hvis der ikke er data (404)."""
    response = requests.get(API_BASE_URL + path, timeout=REQUEST_TIMEOUT_SECONDS)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def flatten(row):
    """Lægger period.start_date og period.end_date op som almindelige kolonner."""
    result = {key: value for key, value in row.items() if key != "period"}
    if isinstance(row.get("period"), dict):
        result["period_start"] = row["period"]["start_date"]
        result["period_end"] = row["period"]["end_date"]
    return result


def rows_of(data):
    """Gør API-svaret til en liste af rækker."""
    if data is None:
        return []
    if isinstance(data, list):
        return [flatten(row) for row in data]
    if "rows" in data:
        common = {
            key: value
            for key, value in flatten(data).items()
            if key not in ("rows",) and not isinstance(value, (dict, list))
        }
        return [{**common, **row} for row in data["rows"]]
    return [flatten(data)]


def collect_tables():
    """Alle tabeller i udtrækket. Perioder er indeværende år og dets måneder."""
    year = date.today().year
    period = f"start_date={year}-01-01&end_date={year}-12-31"

    tables = {
        "revenue_by_type": rows_of(fetch("/api/metrics/revenue?group_by=type")),
        "revenue_by_season": rows_of(fetch("/api/metrics/revenue?group_by=season")),
        "revenue_by_type_season": rows_of(fetch("/api/metrics/revenue?group_by=type_season")),
        "revenue_by_country": rows_of(fetch("/api/metrics/revenue?group_by=country")),
        "revenue_by_year": rows_of(fetch("/api/metrics/revenue?group_by=year")),
        "revenue_annual": rows_of(fetch("/api/metrics/revenue/annual")),
        "revenue_running": rows_of(fetch("/api/metrics/revenue/running")),
        "guests_by_country": rows_of(fetch("/api/metrics/guests/countries")),
        "occupancy_year": rows_of(fetch(f"/api/metrics/occupancy?{period}")),
        "satisfaction_year": rows_of(fetch(f"/api/metrics/satisfaction?{period}")),
        "revpar_year": rows_of(fetch(f"/api/metrics/revpar?{period}")),
        "bar_helene_sales": rows_of(fetch("/api/cocktail/sales")),
        "bar_sales_by_drink": rows_of(fetch("/api/cocktail/sales/products")),
        "bar_distribution": rows_of(fetch("/api/cocktail/sales/distribution")),
        "bookings": rows_of(fetch("/api/bookings")),
    }

    monthly = []
    for month in range(1, 13):
        last_day = monthrange(year, month)[1]
        monthly += rows_of(
            fetch(f"/api/metrics/occupancy?start_date={year}-{month:02d}-01&end_date={year}-{month:02d}-{last_day:02d}")
        )
    tables["occupancy_by_month"] = monthly
    return tables


def is_decimal(name):
    """Beløb kommer som tekst fra API'et, men skal være tal i Tableau."""
    return name.endswith(("_dkk", "_pct")) or name in ("total_price", "average_rating")


def column_type(name):
    """Typen følger kolonnens navn, ikke dens data, så dashboardet ikke går i stykker, når data ændrer sig."""
    if is_decimal(name):
        return SqlType.double()
    if name.endswith(("_id", "_count", "_nights")) or name in ("units_sold", "year"):
        return SqlType.big_int()
    if name == "includes_history":
        return SqlType.bool()
    return SqlType.text()


def cell_value(name, row):
    value = row.get(name)
    return float(value) if is_decimal(name) and value is not None else value


def write_table(connection, name, rows):
    """Tabellen oprettes altid, så en tom bookings-tabel ikke forsvinder fra dashboardet."""
    columns = list(dict.fromkeys(key for row in rows for key in row)) or EMPTY_TABLE_COLUMNS[name]
    definition = TableDefinition(
        TableName("Extract", name),
        [TableDefinition.Column(column, column_type(column)) for column in columns],
    )
    connection.catalog.create_table(definition)

    with Inserter(connection, definition) as inserter:
        for row in rows:
            inserter.add_row([cell_value(column, row) for column in columns])
        inserter.execute()
    print(f"  {name}: {len(rows)} rækker")


def export_once():
    """Skriver til en midlertidig fil og omdøber bagefter, så Tableau aldrig ser en halv fil."""
    started = time.monotonic()
    tables = collect_tables()
    temp_path = f"{OUTPUT_PATH}.{uuid.uuid4().hex}.tmp"

    with HyperProcess(Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU, parameters={"log_config": ""}) as hyper:
        with Connection(hyper.endpoint, temp_path, CreateMode.CREATE_AND_REPLACE) as connection:
            connection.catalog.create_schema("Extract")
            for name, rows in tables.items():
                write_table(connection, name, rows)

    try:
        os.replace(temp_path, OUTPUT_PATH)
    except PermissionError:
        # Tableau låser filen, så længe den er åben, både med Live og Extract. Den gamle fil bliver liggende.
        os.remove(temp_path)
        print("Eksport ikke gemt: Tableau har filen låst. Luk Tableau, så gemmes næste eksport.", file=sys.stderr)
        return
    print(f"Eksport færdig på {time.monotonic() - started:.1f} sekunder: {OUTPUT_PATH}")


def main():
    once = "--once" in sys.argv
    while True:
        try:
            export_once()
        except (requests.RequestException, OSError, HyperException) as error:
            # Den forrige fil bliver liggende, så Tableau stadig kan åbne den.
            print(f"Eksport fejlede, prøver igen ved næste interval: {error}", file=sys.stderr)
            if once:
                sys.exit(1)
        if once:
            return
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
