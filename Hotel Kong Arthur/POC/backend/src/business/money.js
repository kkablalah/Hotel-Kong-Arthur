// Beløb regnes i hele øre, så kommatal ikke giver afrundingsfejl. Resultatet er tekst med 2 decimaler (BR-02).
function toOre(amount) {
  return Math.round(Number(amount) * 100);
}

function oreToDkk(ore) {
  return (ore / 100).toFixed(2);
}

function percent(part, total) {
  if (total === 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

module.exports = { toOre, oreToDkk, percent };
