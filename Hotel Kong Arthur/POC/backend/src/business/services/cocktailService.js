// Nøgletal for cocktailbaren (FR-07, FR-08, FR-09, BR-07).
// Bardata har hverken medarbejder eller årstal. Alt salg regnes som Helene Christines,
// fordi Opgaven siger, at hun laver alle drikkene, og det hører til HISTORIK_AAR (B-32).
const cocktailRepository = require('../../data/repositories/cocktailRepository');
const { historyYear } = require('../history');
const { toOre, oreToDkk, percent } = require('../money');
const { BusinessError } = require('../errors');

function chooseYear(year) {
  const chosen = year === undefined ? historyYear() : Number(year);
  if (chosen !== historyYear()) {
    throw new BusinessError('NO_DATA', `Der er ikke registreret barsalg i ${chosen}`);
  }
  return chosen;
}

async function loadSales() {
  const drinks = await cocktailRepository.findDrinks();
  return drinks.map((d) => ({
    drink: d.drink,
    category: d.category,
    price_dkk: d.price_dkk,
    units: d.units_sold,
    ore: toOre(d.price_dkk) * d.units_sold,
  }));
}

async function getHeleneSales(year) {
  const chosen = chooseYear(year);
  const sales = await loadSales();
  return {
    employee: 'Helene Christine',
    year: chosen,
    total_dkk: oreToDkk(sales.reduce((sum, s) => sum + s.ore, 0)),
    units_sold: sales.reduce((sum, s) => sum + s.units, 0),
  };
}

async function getSalesByDrink(year) {
  chooseYear(year);
  const sales = await loadSales();
  return sales
    .sort((a, b) => b.ore - a.ore)
    .map((s) => ({
      drink: s.drink,
      category: s.category,
      price_dkk: s.price_dkk,
      units_sold: s.units,
      revenue_dkk: oreToDkk(s.ore),
    }));
}

// BR-07: omsætningsandel er hovedtallet, enhedsandel er supplement.
async function getDistribution(year) {
  const chosen = chooseYear(year);
  const sales = await loadSales();
  const totalOre = sales.reduce((sum, s) => sum + s.ore, 0);
  const totalUnits = sales.reduce((sum, s) => sum + s.units, 0);

  const categories = new Map();
  for (const s of sales) {
    const entry = categories.get(s.category) || { category: s.category, ore: 0, units: 0 };
    entry.ore += s.ore;
    entry.units += s.units;
    categories.set(s.category, entry);
  }
  return {
    employee: 'Helene Christine',
    year: chosen,
    rows: [...categories.values()]
      .sort((a, b) => b.ore - a.ore)
      .map((c) => ({
        category: c.category,
        revenue_dkk: oreToDkk(c.ore),
        revenue_share_pct: percent(c.ore, totalOre),
        units_sold: c.units,
        unit_share_pct: percent(c.units, totalUnits),
      })),
  };
}

module.exports = { getHeleneSales, getSalesByDrink, getDistribution };
