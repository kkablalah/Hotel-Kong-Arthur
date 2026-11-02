// Forretningslogik for værelser og værelsestyper. Ingen HTTP og ingen SQL her (constitution princip I).
const roomTypeRepository = require('../../data/repositories/roomTypeRepository');
const roomRepository = require('../../data/repositories/roomRepository');
const countryRepository = require('../../data/repositories/countryRepository');

function listRoomTypes() {
  return roomTypeRepository.findAll();
}

function listRooms() {
  return roomRepository.findAll();
}

function listCountries() {
  return countryRepository.findAll();
}

module.exports = { listRoomTypes, listRooms, listCountries };
