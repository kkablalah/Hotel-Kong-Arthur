// HTTP-lim for cocktailbaren. Selve beregningerne ligger i cocktailService.
const cocktailService = require('../../business/services/cocktailService');

async function sales(req, res) {
  res.json(await cocktailService.getHeleneSales(req.query.aar));
}

async function products(req, res) {
  res.json(await cocktailService.getSalesByDrink(req.query.aar));
}

async function distribution(req, res) {
  res.json(await cocktailService.getDistribution(req.query.aar));
}

module.exports = { sales, products, distribution };
