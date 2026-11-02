// HTTP-lim: kalder servicen og sender JSON. Ingen forretningsregler her (constitution princip I).
const roomService = require('../../business/services/roomService');

async function listRoomTypes(req, res) {
  res.json(await roomService.listRoomTypes());
}

async function listRooms(req, res) {
  res.json(await roomService.listRooms());
}

async function listCountries(req, res) {
  res.json(await roomService.listCountries());
}

module.exports = { listRoomTypes, listRooms, listCountries };
