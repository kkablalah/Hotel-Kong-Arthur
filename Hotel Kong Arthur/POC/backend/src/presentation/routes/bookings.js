const express = require('express');
const controller = require('../controllers/bookings');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/satisfaction', controller.addRating);

module.exports = router;
