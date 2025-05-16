const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getEventReviews,
  createReview,
  replyToReview,
  likeReview,
  deleteReview,
} = require('../controllers/reviewController');

// Routes that work with event ID - these are accessed directly via /api/reviews/...
router.route('/events/:eventId/reviews')
  .get(getEventReviews)
  .post(protect, createReview);

// Routes that work with review ID
router.route('/:reviewId/replies')
  .post(protect, replyToReview);

router.route('/:reviewId/like')
  .post(protect, likeReview);

router.route('/:reviewId')
  .delete(protect, deleteReview);

module.exports = router;
