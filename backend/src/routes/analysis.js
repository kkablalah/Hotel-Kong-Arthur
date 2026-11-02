import express from 'express';
import * as analysisService from '../services/analysisService.js';

const router = express.Router();

const endpoint = (handler) => async (req, res, next) => {
  try {
    res.json(await handler(req.query));
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    return next(error);
  }
};

router.get('/analysis/hotel/summary', endpoint(analysisService.getHotelSummary));
router.get('/analysis/hotel/stay-counts-by-country', endpoint(analysisService.getStayCountsByCountry));
router.get('/analysis/hotel/revenue-by-country', endpoint(analysisService.getHotelRevenueByCountry));
router.get('/analysis/hotel/revenue-by-room-type-season', endpoint(analysisService.getHotelRevenueByRoomTypeSeason));
router.get('/analysis/hotel/top-revenue', endpoint(analysisService.getTopHotelRevenue));
router.get('/analysis/hotel/average-stay-length', endpoint(analysisService.getAverageStayLength));
router.get('/analysis/bar/summary', endpoint(analysisService.getBarSummary));
router.get('/analysis/bar/products', endpoint(analysisService.getBarProducts));
router.get('/analysis/bar/category-shares', endpoint(analysisService.getBarCategoryShares));

export default router;
