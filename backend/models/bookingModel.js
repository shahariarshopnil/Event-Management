const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    attendees: [
      {
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
      },
    ],
    numberOfTickets: {
      type: Number,
      required: true,
      default: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'cash'],
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'pending',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    appointmentTime: {
      type: Date,
    },
    specialRequirements: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
