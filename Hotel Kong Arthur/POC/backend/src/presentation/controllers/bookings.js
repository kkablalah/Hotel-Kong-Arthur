// HTTP-lim for bookinger: oversætter request til service-kald og sætter statuskoder.
const bookingService = require('../../business/services/bookingService');

async function list(req, res) {
  const { room_id: roomId, start_date: startDate, end_date: endDate } = req.query;
  res.json(await bookingService.list({ roomId, startDate, endDate }));
}

async function get(req, res) {
  res.json(await bookingService.get(req.params.id));
}

async function create(req, res) {
  res.status(201).json(await bookingService.create(req.body));
}

async function update(req, res) {
  res.json(await bookingService.update(req.params.id, req.body));
}

async function remove(req, res) {
  await bookingService.remove(req.params.id);
  res.sendStatus(204);
}

async function addRating(req, res) {
  res.status(201).json(await bookingService.addRating(req.params.id, req.body));
}

module.exports = { list, get, create, update, remove, addRating };
