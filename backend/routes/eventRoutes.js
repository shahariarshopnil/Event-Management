const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getFeaturedEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  registerForEvent,
  cancelEventRegistration,
  getAttendingEvents,
} = require('../controllers/eventController');
const { protect, organizer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/upcoming', getUpcomingEvents);

// Protected routes - note: specific paths must come before parameter routes
router.get('/attending', protect, getAttendingEvents); // Changed from /attending/me to /attending

// Organizer routes
router.post('/', protect, organizer, upload.single('eventImage'), createEvent);
router.get('/myevents', protect, organizer, getMyEvents);

// Forward review requests for events
const { getEventReviews, createReview } = require('../controllers/reviewController');

// Add routes for handling reviews directly within events routes
router.route('/:id/reviews')
  .get(getEventReviews) // Get reviews for an event
  .post(protect, createReview); // Create a review for an event

// Routes with ID parameters - these must come after specific routes
router.get('/:id', getEventById);
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/cancel', protect, cancelEventRegistration);
router.put('/:id', protect, organizer, upload.single('eventImage'), updateEvent);
router.delete('/:id', protect, organizer, deleteEvent);

module.exports = router;
