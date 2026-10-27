(function () {
  const message = document.querySelector("#message");
  const button = document.querySelector("#connect");

  if (typeof tableau === "undefined") {
    message.textContent = "Åbn denne side gennem Tableau.";
    button.disabled = true;
    return;
  }

  const connector = tableau.makeConnector();

  // Fortæller Tableau, hvilke kolonner vi sender.
  connector.getSchema = function (schemaCallback) {
    const columns = [
      { id: "id", alias: "Booking ID", dataType: tableau.dataTypeEnum.int },
      { id: "roomNumber", alias: "Værelsesnummer", dataType: tableau.dataTypeEnum.int },
      { id: "checkIn", alias: "Ankomst", dataType: tableau.dataTypeEnum.date },
      { id: "checkOut", alias: "Afrejse", dataType: tableau.dataTypeEnum.date },
      { id: "nights", alias: "Antal nætter", dataType: tableau.dataTypeEnum.int },
      { id: "status", alias: "Status", dataType: tableau.dataTypeEnum.string }
    ];

    schemaCallback([{
      id: "bookings",
      alias: "Hotellets bookinger",
      columns: columns
    }]);
  };

  // Henter bookinger gennem den eksisterende Nginx-proxy.
  connector.getData = function (table, doneCallback) {
    fetch("/api/bookings")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("API'et svarede med fejl " + response.status);
        }

        return response.json();
      })
      .then(function (bookings) {
        if (!Array.isArray(bookings)) {
          throw new Error("API'et returnerede ikke en liste.");
        }

        const rows = bookings.map(function (booking) {
          const arrival = booking.checkIn.slice(0, 10);
          const departure = booking.checkOut.slice(0, 10);

          return {
            id: booking.id,
            roomNumber: booking.roomNumber,
            checkIn: arrival,
            checkOut: departure,
            nights: Math.round(
              (Date.parse(departure) - Date.parse(arrival)) / 86400000
            ),
            status: booking.status
          };
        });

        table.appendRows(rows);
        doneCallback();
      })
      .catch(function (error) {
        tableau.abortWithError(error.message);
      });
  };

  tableau.registerConnector(connector);

  button.addEventListener("click", function () {
    tableau.connectionName = "Hotel Kong Arthur – Booking API";
    tableau.submit();
  });
})();