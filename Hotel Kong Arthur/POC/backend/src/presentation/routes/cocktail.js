const express = require('express');
const controller = require('../controllers/cocktail');

const router = express.Router();

router.get('/sales', controller.sales);
router.get('/sales/products', controller.products);
router.get('/sales/distribution', controller.distribution);

module.exports = router;
