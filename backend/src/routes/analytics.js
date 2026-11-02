import express from 'express';
import {
  getBarSalesAnalysis,
  getBarMenu,
  getOverview,
  getOccupancyAnalysis,
  getRevenueAnalysis,
  getSatisfactionAnalysis,
  recordBarSale,
  recordFeedback,
} from '../services/analyticsService.js';

const router = express.Router();

const handleError = (err, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  return next(err);
};

const addAnalyticsRoute = (path, handler) => {
  router.get(path, async (req, res, next) => {
    try {
      res.json(await handler(req.query.from, req.query.to));
    } catch (err) {
      handleError(err, res, next);
    }
  });
};

router.get('/analytics/overview', async (req, res, next) => {
  try {
    res.json(await getOverview(req.query.from, req.query.to));
  } catch (err) {
    handleError(err, res, next);
  }
});

addAnalyticsRoute('/analytics/occupancy', getOccupancyAnalysis);
addAnalyticsRoute('/analytics/revenue', getRevenueAnalysis);
addAnalyticsRoute('/analytics/satisfaction', getSatisfactionAnalysis);
addAnalyticsRoute('/analytics/bar-sales', getBarSalesAnalysis);

router.get('/bar-menu', async (req, res, next) => {
  try {
    res.json(await getBarMenu());
  } catch (err) {
    next(err);
  }
});

router.post('/bar-sales', async (req, res, next) => {
  try {
    const sale = await recordBarSale(req.body || {});
    res.status(201).json(sale);
  } catch (err) {
    handleError(err, res, next);
  }
});

router.post('/feedback', async (req, res, next) => {
  try {
    const feedback = await recordFeedback(req.body || {});
    res.status(201).json(feedback);
  } catch (err) {
    handleError(err, res, next);
  }
});

export default router;
