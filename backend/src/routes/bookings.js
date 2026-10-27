import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../services/bookingService.js';

const router = express.Router();

// --- Præsentationslag: REST ruter ---

// Hent alle bookinger
router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Hent én booking
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking ikke fundet' });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Opret ny booking
router.post('/bookings', async (req, res, next) => {
  try {
    const booking = await createBooking(req.body);
    res.status(201).json(booking);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// Opdater eksisterende booking
router.put('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await updateBooking(req.params.id, req.body);
    if (!booking) {
      return res.status(404).json({ error: 'Booking ikke fundet' });
    }
    res.json(booking);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// Slet booking
router.delete('/bookings/:id', async (req, res, next) => {
  try {
    const deleted = await deleteBooking(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Booking ikke fundet' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
