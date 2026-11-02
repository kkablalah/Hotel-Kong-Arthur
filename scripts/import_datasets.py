#!/usr/bin/env python3
"""Repeatably import the two source workbooks into the uge2 PostgreSQL stack."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "p": "http://schemas.openxmlformats.org/package/2006/relationships",
}
SPECS = [
    {
        "file": "international_names_with_rooms_1000.xlsx",
        "table": "hotel_stays",
        "columns": ["First Name", "Family Name", "Country", "Room Type", "Days Rented", "Season", "Price"],
        "fields": ["first_name", "family_name", "country", "room_type", "days_rented", "season", "price"],
        "types": ["text", "text", "text", "text", "integer", "text", "decimal"],
        "expected": 1000,
    },
    {
        "file": "drinks_menu_with_sales.xlsx",
        "table": "drink_products",
        "columns": ["Drink Name", "Category", "Price (DKK)", "Units Sold"],
        "fields": ["drink_name", "category", "price", "units_sold"],
        "types": ["text", "text", "decimal", "integer"],
        "expected": 30,
    },
]


def read_workbook(path: Path, expected_headers: list[str]) -> tuple[str, list[tuple[int, list[str]]]]:
    errors: list[str] = []
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheets = workbook.find("m:sheets", NS)
        if sheets is None or len(sheets) != 1:
            raise ValueError(f"{path.name}: forventede præcis ét ark")
        sheet = sheets[0]
        sheet_name = sheet.attrib["name"]
        rel_id = sheet.attrib[f"{{{NS['r']}}}id"]
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next(rel.attrib["Target"] for rel in rels if rel.attrib["Id"] == rel_id)
        sheet_path = target.lstrip("/") if target.startswith("/") else "xl/" + target
        strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(t.text or "" for t in item.findall(".//m:t", NS)) for item in root.findall("m:si", NS)]
        root = ET.fromstring(archive.read(sheet_path))
        parsed: list[tuple[int, list[str], list[str]]] = []
        for row in root.findall(".//m:sheetData/m:row", NS):
            row_number = int(row.attrib["r"])
            values: dict[int, tuple[str, str]] = {}
            for cell in row.findall("m:c", NS):
                ref = cell.attrib.get("r", "")
                col_match = re.match(r"([A-Z]+)", ref)
                if not col_match:
                    continue
                col_num = 0
                for char in col_match.group(1):
                    col_num = col_num * 26 + ord(char) - 64
                kind = cell.attrib.get("t", "n")
                if cell.find("m:f", NS) is not None:
                    errors.append(f"række {row_number}, {ref}: formler understøttes ikke")
                    continue
                value_node = cell.find("m:v", NS)
                if kind == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall(".//m:t", NS))
                    kind = "s"
                elif value_node is None:
                    value = ""
                else:
                    value = value_node.text or ""
                if kind == "s":
                    try:
                        value = strings[int(value)]
                    except (ValueError, IndexError):
                        errors.append(f"række {row_number}, {ref}: ugyldig shared string")
                        value = ""
                elif kind not in ("n", ""):
                    errors.append(f"række {row_number}, {ref}: uventet celletype {kind}")
                values[col_num] = (value, kind)
            if values:
                width = max(values)
                parsed.append((row_number, [values.get(i, ("", ""))[0] for i in range(1, width + 1)],
                               [values.get(i, ("", ""))[1] for i in range(1, width + 1)]))
    if not parsed:
        raise ValueError(f"{path.name}: regnearket er tomt")
    header = parsed[0][1]
    if header != expected_headers:
        errors.append(f"række {parsed[0][0]}: kolonner {header!r}, forventede {expected_headers!r}")
    records: list[tuple[int, list[str]]] = []
    for row_number, values, cell_types in parsed[1:]:
        if len(values) != len(expected_headers):
            errors.append(f"række {row_number}: forventede {len(expected_headers)} felter, fandt {len(values)}")
            continue
        if all(value == "" for value in values):
            errors.append(f"række {row_number}: tom datarække")
            continue
        records.append((row_number, values, cell_types))
    if errors:
        raise ValueError(f"{path.name}:\n  " + "\n  ".join(errors))
    return sheet_name, records


def typed(value: str, kind: str, file: str, row: int, column: str):
    if value == "":
        raise ValueError(f"{file}, række {row}, {column}: mangler værdi")
    if kind == "text":
        return value
    try:
        number = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{file}, række {row}, {column}: ugyldigt tal {value!r}") from exc
    if not number.is_finite():
        raise ValueError(f"{file}, række {row}, {column}: tallet er ikke endeligt")
    if kind == "integer":
        if number != number.to_integral_value():
            raise ValueError(f"{file}, række {row}, {column}: forventede heltal, fandt {value!r}")
        return int(number)
    return number


def sql_literal(value) -> str:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def main() -> int:
    all_records: dict[str, list[tuple]] = {}
    expected_hotel_sum = Decimal(0)
    expected_drink_units = 0
    expected_drink_revenue = Decimal(0)
    invalid: list[str] = []
    for spec in SPECS:
        path = ROOT / "Datasets" / spec["file"]
        sheet, rows = read_workbook(path, spec["columns"])
        if len(rows) != spec["expected"]:
            invalid.append(f"{spec['file']}: forventede {spec['expected']} datarækker, fandt {len(rows)}")
        validated = []
        for row_number, raw, cell_types in rows:
            try:
                for value, expected_type, cell_type, col in zip(raw, spec["types"], cell_types, spec["columns"]):
                    if value and ((expected_type == "text" and cell_type == "n")
                                  or (expected_type in ("integer", "decimal") and cell_type not in ("n", ""))):
                        raise ValueError(f"{spec['file']}, række {row_number}, {col}: uventet datatype")
                values = [typed(value, kind, spec["file"], row_number, col)
                          for value, kind, col in zip(raw, spec["types"], spec["columns"])]
                # Keep exact cell strings as well as the validated database types.
                validated.append((spec["file"], sheet, row_number, values, dict(zip(spec["columns"], raw))))
                if spec["table"] == "hotel_stays":
                    expected_hotel_sum += values[-1]
                else:
                    expected_drink_units += values[-1]
                    expected_drink_revenue += values[-2] * values[-1]
            except ValueError as exc:
                invalid.append(str(exc))
        all_records[spec["table"]] = validated
    if invalid:
        print("Import afbrudt; ugyldige rækker eller felter:", file=sys.stderr)
        for error in invalid:
            print(f"- {error}", file=sys.stderr)
        return 2

    sql = ["BEGIN;"]
    for spec in SPECS:
        table = spec["table"]
        cols = ["source_file", "source_sheet", "source_row", *spec["fields"], "raw_values"]
        rows_sql = []
        for filename, sheet, row_number, values, raw in all_records[table]:
            vals = [filename, sheet, row_number, *values, json.dumps(raw, ensure_ascii=False)]
            literal_values = [sql_literal(v) for v in vals[:-1]] + [sql_literal(vals[-1]) + "::jsonb"]
            rows_sql.append("(" + ",".join(literal_values) + ")")
        updates = ", ".join(f"{col}=EXCLUDED.{col}" for col in [*spec["fields"], "raw_values"])
        sql.append(
            f"INSERT INTO {table} ({','.join(cols)}) VALUES\n" + ",\n".join(rows_sql)
            + f"\nON CONFLICT (source_file,source_sheet,source_row) DO UPDATE SET {updates}"
            + " WHERE " + table + ".raw_values IS DISTINCT FROM EXCLUDED.raw_values;"
        )
    sql.extend([
        "COMMIT;",
        "SELECT 'HOTEL' || '|' || COUNT(*) || '|' || COALESCE(SUM(price),0) FROM hotel_stays;",
        "SELECT 'DRINK' || '|' || COUNT(*) || '|' || COALESCE(SUM(units_sold),0) || '|' || COALESCE(SUM(price * units_sold),0) FROM drink_products;",
    ])
    command = ["docker", "compose", "--env-file", ".env", "-f", "compose.uge2.yaml", "exec", "-T", "postgres",
               "sh", "-c", 'exec psql -X -q -A -t -F "|" -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"']
    result = subprocess.run(command, input="\n".join(sql), text=True, capture_output=True, cwd=ROOT)
    if result.returncode:
        print(result.stderr.strip(), file=sys.stderr)
        print("Importen fejlede. Kontrollér at uge 2 PostgreSQL kører; ingen anden Compose-fil bruges.", file=sys.stderr)
        return result.returncode
    observed = {}
    for line in result.stdout.splitlines():
        pieces = line.split("|")
        if pieces[0] == "HOTEL":
            observed["hotel"] = (int(pieces[1]), Decimal(pieces[2]))
        elif pieces[0] == "DRINK":
            observed["drink"] = (int(pieces[1]), int(pieces[2]), Decimal(pieces[3]))
    expected = {
        "hotel": (1000, expected_hotel_sum),
        "drink": (30, expected_drink_units, expected_drink_revenue),
    }
    if observed != expected:
        print(f"Kontrol fejlede: database={observed}, regneark={expected}", file=sys.stderr)
        return 3
    print(f"Hoteldata: {observed['hotel'][0]} rækker; SUM(Price) = {observed['hotel'][1]:,.2f} kr.")
    print(f"Bardata: {observed['drink'][0]} produkter; antal solgte = {observed['drink'][1]:,}; Price × Units Sold = {observed['drink'][2]:,.2f} kr.")
    print("Databasetallene matcher den uafhængige beregning fra regnearkene. Gentag kommandoen for idempotenskontrol.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
