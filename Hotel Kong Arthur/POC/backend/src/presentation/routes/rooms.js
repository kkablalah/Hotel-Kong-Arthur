const express = require('express');
const controller = require('../controllers/rooms');

const router = express.Router();

router.get('/room-types', controller.listRoomTypes);
router.get('/rooms', controller.listRooms);
router.get('/countries', controller.listCountries);

module.exports = router;
