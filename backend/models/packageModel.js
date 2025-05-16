const mongoose = require('mongoose');

const packageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a package name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [false, 'Please add a price'],
      min: [1, 'Price must be at least 1'],
    },
    features: [
      {
        type: String,
        required: [true, 'Please add at least one feature'],
      },
    ],
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    maxBookings: {
      type: Number,
      required: [true, 'Please add maximum number of bookings'],
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    // availableBookings is calculated as a virtual below
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting available bookings
packageSchema.virtual('availableBookings').get(function() {
  return this.maxBookings - (this.bookingCount || 0);
});

module.exports = mongoose.model('Package', packageSchema);
