const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');

// @desc    Get all reviews for an event
// @route   GET /api/events/:eventId/reviews
// @access  Public
const getEventReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ event: req.params.eventId })
    .populate('user', 'name email profileImage isVerified')
    .populate('event', 'title organizer')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Create a new review
// @route   POST /api/events/:eventId/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const eventId = req.params.eventId;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Check if user has already reviewed this event
  const alreadyReviewed = await Review.findOne({
    user: req.user._id,
    event: eventId,
    isReply: false,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this event');
  }

  // Check if user has attended the event or is admin
  // This would ideally check booking records to verify attendance
  const hasAttended = true; // Replace with actual attendance check logic

  if (!hasAttended && !req.user.isAdmin) {
    res.status(400);
    throw new Error('You must attend the event to leave a review');
  }

  const review = new Review({
    user: req.user._id,
    event: eventId,
    rating,
    comment,
    likes: [],
    isReply: false,
  });

  const createdReview = await review.save();

  // Populate user information
  await createdReview.populate('user', 'name email profileImage isVerified');
  await createdReview.populate('event', 'title organizer');

  res.status(201).json(createdReview);
});

// @desc    Reply to a review
// @route   POST /api/reviews/:reviewId/replies
// @access  Private
const replyToReview = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const reviewId = req.params.reviewId;

  // Check if original review exists
  const originalReview = await Review.findById(reviewId);
  if (!originalReview) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Create the reply
  const reply = new Review({
    user: req.user._id,
    event: originalReview.event,
    rating: originalReview.rating, // We maintain the original rating
    comment,
    likes: [],
    isReply: true,
    parentReview: reviewId,
  });

  const createdReply = await reply.save();

  // Populate user information
  await createdReply.populate('user', 'name email profileImage isVerified');
  await createdReply.populate('event', 'title organizer');

  res.status(201).json(createdReply);
});

// @desc    Like/unlike a review
// @route   POST /api/reviews/:reviewId/like
// @access  Private
const likeReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  const userId = req.user._id;

  // Check if review exists
  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user already liked the review
  const alreadyLiked = review.likes.includes(userId);

  if (alreadyLiked) {
    // Unlike the review
    review.likes = review.likes.filter(
      (like) => like.toString() !== userId.toString()
    );
  } else {
    // Like the review
    review.likes.push(userId);
  }

  const updatedReview = await review.save();

  // Populate user information
  await updatedReview.populate('user', 'name email profileImage isVerified');
  await updatedReview.populate('event', 'title organizer');

  res.json(updatedReview);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private/Admin/Owner
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user is admin or review owner
  if (
    review.user.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized to delete this review');
  }

  // If it's a parent review, also delete all replies
  if (!review.isReply) {
    await Review.deleteMany({ parentReview: review._id });
  }

  await review.remove();

  res.json({ message: 'Review removed' });
});

module.exports = {
  getEventReviews,
  createReview,
  replyToReview,
  likeReview,
  deleteReview,
};
