// De leverede ophold og det leverede barsalg har ingen datoer. De hører til dette år (BR-04, BR-06).
function historyYear() {
  return Number(process.env.HISTORIK_AAR || 2025);
}

module.exports = { historyYear };
