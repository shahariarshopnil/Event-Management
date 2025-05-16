const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot be more than 200 characters']
    },
    date: {
      type: Date,
      required: [true, 'Please add an event date'],
    },
    endDate: {
      type: Date,
    },
    time: {
      type: String,
      required: [true, 'Please add a start time'],
    },
    endTime: {
      type: String,
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    country: {
      type: String,
    },
    eventImage: {
      type: String,
      default: 'default-event.jpg',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please set a price for the event'],
      min: [1, 'Price must be at least 1'],
      validate: {
        validator: function(v) {
          return v >= 1;
        },
        message: props => `${props.value} is not a valid price. Price must be at least 1!`
      }
    },
    maxAttendees: {
      type: Number,
      required: [true, 'Please add a maximum number of attendees'],
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['confirmed', 'pending', 'cancelled'],
          default: 'pending',
        },
        bookingDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // availableSlots is calculated as a virtual below
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    availablePackages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
      },
    ],
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting available slots
eventSchema.virtual('availableSlots').get(function() {
  const confirmedAttendees = this.attendees.filter(
    attendee => attendee.status === 'confirmed'
  ).length;
  return this.maxAttendees - confirmedAttendees;
});

// Update event status based on date
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (this.date > now && this.status !== 'cancelled') {
    this.status = 'upcoming';
  } else if (this.date <= now && this.endDate >= now && this.status !== 'cancelled') {
    this.status = 'ongoing';
  } else if (this.endDate < now && this.status !== 'cancelled') {
    this.status = 'completed';
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
