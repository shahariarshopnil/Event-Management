const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getOrganizerBookings,
  updateBookingStatus,
  scheduleAppointment,
} = require('../controllers/bookingController');
const { protect, organizer } = require('../middleware/authMiddleware');

// User routes
router.post('/', protect, createBooking);
router.get('/', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/appointment', protect, scheduleAppointment);

// Organizer routes
router.get('/organizer', protect, organizer, getOrganizerBookings);
router.put('/:id/status', protect, organizer, updateBookingStatus);

module.exports = router;
