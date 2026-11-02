(function () {
  const CONNECTOR_VERSION = "HKA-U2-2026.11.02.4";
  const versionLabel = document.querySelector("#connector-script-version");
  const getDataStatus = document.querySelector("#connector-getdata-status");
  if (versionLabel) versionLabel.textContent = "JavaScript version loaded: " + CONNECTOR_VERSION;

  const message = document.querySelector("#message");
  const button = document.querySelector("#connect");

  if (typeof tableau === "undefined") {
    message.textContent = "Åbn denne side gennem Tableau.";
    button.disabled = true;
    return;
  }

  const connector = tableau.makeConnector();
  const types = tableau.dataTypeEnum;

  // Each Tableau table maps to one API result. Singleton totals stay in their
  // own one-row tables, so Tableau cannot accidentally sum a repeated total
  // once for every country, room, or product.
  const tableDefinitions = {
    bookings: {
      alias: "Hotellets bookinger",
      path: "/api/bookings",
      isArray: true,
      columns: [
        { id: "id", alias: "Booking ID", dataType: types.int },
        { id: "roomNumber", alias: "Værelsesnummer", dataType: types.int },
        { id: "checkIn", alias: "Ankomst", dataType: types.date },
        { id: "checkOut", alias: "Afrejse", dataType: types.date },
        { id: "nights", alias: "Antal nætter", dataType: types.int },
        { id: "status", alias: "Status", dataType: types.string }
      ],
      rows: function (bookings) {
        if (!Array.isArray(bookings)) throw new Error("Booking-API'et returnerede ikke en liste.");
        return bookings.map(function (booking) {
          const arrival = booking.checkIn.slice(0, 10);
          const departure = booking.checkOut.slice(0, 10);
          return {
            id: booking.id,
            roomNumber: booking.roomNumber,
            checkIn: arrival,
            checkOut: departure,
            nights: Math.round((Date.parse(departure) - Date.parse(arrival)) / 86400000),
            status: booking.status
          };
        });
      }
    },
    hotel_summary: {
      alias: "Uge 2 – hoteloversigt (samlede mål)",
      path: "/api/analysis/hotel/summary",
      columns: [
        { id: "registeredStays", alias: "Registrerede ophold", dataType: types.int },
        { id: "totalAmount", alias: "Hotelbeløb (DKK; SUM Price)", dataType: types.float },
        { id: "averageDaysRented", alias: "Gennemsnitlig Days Rented", dataType: types.float }
      ],
      rows: function (data) {
        if (!data || typeof data !== "object" || !Object.prototype.hasOwnProperty.call(data, "registeredStays")) {
          const keys = data && typeof data === "object" ? Object.keys(data).join(", ") : typeof data;
          throw new Error("hotel/summary forventer response.data med registeredStays; modtog data med felter: " + keys);
        }
        return [data];
      }
    },
    hotel_stays_by_country: {
      alias: "Uge 2 – registrerede ophold pr. land",
      path: "/api/analysis/hotel/stay-counts-by-country",
      columns: [
        { id: "country", alias: "Land", dataType: types.string },
        { id: "registeredStays", alias: "Registrerede ophold", dataType: types.int }
      ],
      rows: function (data) { return data; }
    },
    hotel_revenue_by_country: {
      alias: "Uge 2 – hotelbeløb pr. land",
      path: "/api/analysis/hotel/revenue-by-country",
      columns: [
        { id: "country", alias: "Land", dataType: types.string },
        { id: "registeredStays", alias: "Registrerede ophold", dataType: types.int },
        { id: "amount", alias: "Hotelbeløb (DKK)", dataType: types.float }
      ],
      rows: function (data) { return data; }
    },
    hotel_room_type_season: {
      alias: "Uge 2 – hotelbeløb pr. værelsestype og sæson",
      path: "/api/analysis/hotel/revenue-by-room-type-season",
      columns: [
        { id: "roomType", alias: "Værelsestype", dataType: types.string },
        { id: "season", alias: "Sæson (kildens værdi)", dataType: types.string },
        { id: "registeredStays", alias: "Registrerede ophold", dataType: types.int },
        { id: "amount", alias: "Hotelbeløb (DKK)", dataType: types.float }
      ],
      rows: function (data) { return data; }
    },
    hotel_top_countries: {
      alias: "Uge 2 – højest hotelbeløb pr. land (førstepladser)",
      path: "/api/analysis/hotel/top-revenue?groupBy=country",
      columns: [
        { id: "value", alias: "Land", dataType: types.string },
        { id: "amount", alias: "Hotelbeløb på førsteplads (DKK)", dataType: types.float }
      ],
      rows: function (data) { return data.leaders; }
    },
    hotel_top_room_types: {
      alias: "Uge 2 – højest hotelbeløb pr. værelsestype (førstepladser)",
      path: "/api/analysis/hotel/top-revenue?groupBy=roomType",
      columns: [
        { id: "value", alias: "Værelsestype", dataType: types.string },
        { id: "amount", alias: "Hotelbeløb på førsteplads (DKK)", dataType: types.float }
      ],
      rows: function (data) { return data.leaders; }
    },
    hotel_average_stay: {
      alias: "Uge 2 – gennemsnitlig Days Rented",
      path: "/api/analysis/hotel/average-stay-length",
      columns: [
        { id: "registeredStays", alias: "Registrerede ophold", dataType: types.int },
        { id: "averageDaysRented", alias: "Gennemsnitlig Days Rented", dataType: types.float }
      ],
      rows: function (data) { return [data]; }
    },
    bar_summary: {
      alias: "Uge 2 – baroversigt (samlede mål)",
      path: "/api/analysis/bar/summary",
      columns: [
        { id: "productCount", alias: "Antal produkter", dataType: types.int },
        { id: "unitsSold", alias: "Solgte enheder", dataType: types.int },
        { id: "totalRevenue", alias: "Barbeløb (DKK; Price × Units Sold)", dataType: types.float }
      ],
      rows: function (data) { return [data]; }
    },
    bar_products: {
      alias: "Uge 2 – barbeløb pr. drink",
      path: "/api/analysis/bar/products",
      columns: [
        { id: "drinkName", alias: "Drink", dataType: types.string },
        { id: "category", alias: "Kategori", dataType: types.string },
        { id: "unitPrice", alias: "Stykpris (DKK; POC-antagelse)", dataType: types.float },
        { id: "unitsSold", alias: "Solgte enheder", dataType: types.int },
        { id: "revenue", alias: "Barbeløb pr. drink (DKK)", dataType: types.float }
      ],
      rows: function (data) { return data; }
    },
    bar_category_shares: {
      alias: "Uge 2 – cocktail/kaffe-andel efter antal",
      path: "/api/analysis/bar/category-shares",
      columns: [
        { id: "category", alias: "Kategori", dataType: types.string },
        { id: "unitsSold", alias: "Solgte enheder i kategori", dataType: types.int },
        { id: "sharePercent", alias: "Andel af solgte enheder (%)", dataType: types.float }
      ],
      rows: function (data) { return data.categories; }
    }
  };

  connector.getSchema = function (schemaCallback) {
    schemaCallback(Object.entries(tableDefinitions).map(function ([id, definition]) {
      return { id: id, alias: definition.alias, columns: definition.columns };
    }));
  };

  connector.getData = function (table, doneCallback) {
    const tableId = table && table.tableInfo && table.tableInfo.id
      ? table.tableInfo.id : "(ukendt tabel)";
    if (getDataStatus) getDataStatus.textContent = "getData: " + CONNECTOR_VERSION + " | tabel '" + tableId + "'";
    const definition = tableDefinitions[tableId];
    const reportError = function (error) {
      const detail = error && error.message ? error.message : String(error);
      const message = "Connector " + CONNECTOR_VERSION + " | tabel '" + tableId + "': " + detail;
      if (typeof console !== "undefined" && console.error) console.error(message, error);
      tableau.abortWithError(message);
    };
    if (typeof console !== "undefined" && console.info) {
      console.info("Connector " + CONNECTOR_VERSION + " | getData tabel '" + tableId + "'");
    }

    if (!definition) {
      reportError(new Error("Ukendt Tableau-tabel."));
      return;
    }

    Promise.resolve()
      .then(function () { return fetch(definition.path); })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Analyse-API'et svarede med fejl " + response.status + " for " + definition.path);
        }
        return response.json();
      })
      .then(function (body) {
        if (!body || (!definition.isArray && !body.data)) {
          throw new Error("Analyse-API'et returnerede et ugyldigt svar for " + definition.path);
        }
        const sourceRows = definition.rows(definition.isArray ? body : body.data);
        if (!Array.isArray(sourceRows)) {
          throw new Error("API-svaret har forkert format for " + table.tableInfo.id + ".");
        }

        const rows = sourceRows.map(function (row) {
          if (!row || typeof row !== "object") {
            throw new Error("API-svaret indeholder en ugyldig række for " + table.tableInfo.id + ".");
          }
          const converted = {};
          definition.columns.forEach(function (column) {
            if (!Object.prototype.hasOwnProperty.call(row, column.id)) {
              throw new Error("API-svaret mangler feltet '" + column.id + "'. Rækkens felter: " + Object.keys(row).join(", ") + ".");
            }
            const value = row[column.id];
            if (value === undefined) {
              throw new Error("API-svaret har undefined for feltet '" + column.id + "'.");
            }
            if (value === null) {
              if (column.id !== "averageDaysRented") {
                throw new Error("API-feltet '" + column.id + "' er null; forventede en faktisk værdi.");
              }
              converted[column.id] = null;
            } else if (column.dataType === types.float || column.dataType === types.int) {
              const numericValue = Number(value);
              if (!Number.isFinite(numericValue) || (column.dataType === types.int && !Number.isInteger(numericValue))) {
                throw new Error("API-feltet '" + column.id + "' har en ugyldig talværdi i " + table.tableInfo.id + ".");
              }
              converted[column.id] = numericValue;
            } else {
              converted[column.id] = value;
            }
          });
          return converted;
        });
        table.appendRows(rows);
        doneCallback();
      })
      .catch(function (error) {
        reportError(error);
      });
  };

  tableau.registerConnector(connector);

  button.addEventListener("click", function () {
    tableau.connectionName = "Hotel Kong Arthur – Booking API";
    tableau.submit();
  });
})();
