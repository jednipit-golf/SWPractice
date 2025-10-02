const express = require('express');
const { getReservations,
    getReservationsById,
    addReservations,
    updateReservations,
    deleteReservations
} = require('../controllers/reservationsController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getReservations)
    .post(protect, authorize('admin', 'user'), addReservations);
router.route('/:id')
    .get(protect, getReservationsById)
    .put(protect, authorize('admin', 'user'), updateReservations)
    .delete(protect, authorize('admin', 'user'), deleteReservations);

module.exports = router;