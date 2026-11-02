// HTTP-lim for nøgletal. Selve beregningerne ligger i metricsService.
const metricsService = require('../../business/services/metricsService');

async function occupancy(req, res) {
  res.json(await metricsService.getOccupancy(req.query.start_date, req.query.end_date));
}

async function revenue(req, res) {
  res.json(await metricsService.getRevenue(req.query.group_by, req.query.start_date, req.query.end_date));
}

async function annualRevenue(req, res) {
  res.json(await metricsService.getAnnualRevenue(req.query.aar));
}

async function runningRevenue(req, res) {
  res.json(await metricsService.getRunningRevenue());
}

async function guestsByCountry(req, res) {
  res.json(await metricsService.getGuestsByCountry(req.query.start_date, req.query.end_date));
}

async function satisfaction(req, res) {
  res.json(await metricsService.getSatisfaction(req.query.start_date, req.query.end_date));
}

async function revpar(req, res) {
  res.json(await metricsService.getRevpar(req.query.start_date, req.query.end_date));
}

module.exports = { occupancy, revenue, annualRevenue, runningRevenue, guestsByCountry, satisfaction, revpar };
