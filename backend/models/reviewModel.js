const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Event',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isReply: {
      type: Boolean,
      default: false,
    },
    parentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per event unless it's a reply
reviewSchema.index({ user: 1, event: 1, isReply: 1 }, {
  unique: true,
  partialFilterExpression: { isReply: false }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
