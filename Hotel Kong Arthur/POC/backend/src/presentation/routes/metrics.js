const express = require('express');
const controller = require('../controllers/metrics');

const router = express.Router();

router.get('/occupancy', controller.occupancy);
router.get('/revenue', controller.revenue);
router.get('/revenue/annual', controller.annualRevenue);
router.get('/revenue/running', controller.runningRevenue);
router.get('/guests/countries', controller.guestsByCountry);
router.get('/satisfaction', controller.satisfaction);
router.get('/revpar', controller.revpar);

module.exports = router;
