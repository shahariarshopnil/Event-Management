const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const Package = require('../models/packageModel');
const Notification = require('../models/notificationModel');
const { format } = require('date-fns');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    console.log('Booking request received:', req.body);
    const {
      event: eventId,
      package: packageId,
      numberOfTickets,
      attendees,
      paymentMethod,
      specialRequirements,
      appointmentTime,
    } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // Check if there are enough available slots
    const confirmedAttendees = event.attendees.filter(
      (a) => a.status === 'confirmed'
    ).length;
    
    if (confirmedAttendees + parseInt(numberOfTickets) > event.maxAttendees) {
      res.status(400);
      throw new Error('Not enough available slots for this event');
    }

    let totalAmount = event.price * numberOfTickets;
    let selectedPackage = null;

    // If a package is selected, validate and calculate price
    if (packageId) {
      console.log('Package ID provided:', packageId);
      
      try {
        // Ensure packageId is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        const isValidId = mongoose.Types.ObjectId.isValid(packageId);
        
        if (!isValidId) {
          console.error('Invalid package ID format:', packageId);
          // Instead of throwing an error, we'll just use the event price
          totalAmount = event.price * numberOfTickets;
        } else {
          selectedPackage = await Package.findById(packageId);
          console.log('Package found:', selectedPackage ? 'Yes' : 'No');
          
          if (!selectedPackage) {
            console.error('Package not found with ID:', packageId);
            // Instead of throwing an error, we'll just use the event price
            totalAmount = event.price * numberOfTickets;
          } else {
            // Calculate total amount based on package price
            totalAmount = selectedPackage.price * numberOfTickets;
            console.log('Total amount calculated:', totalAmount);
          }
        }
      } catch (error) {
        console.error('Error finding package:', error);
        // If there's an error finding the package, fall back to using event price
        totalAmount = event.price * numberOfTickets;
      }
    }

    // Create booking object
    const bookingData = {
      event: eventId,
      user: req.user._id,
      numberOfTickets: numberOfTickets || 1,
      totalAmount: totalAmount || (event.price * (numberOfTickets || 1)),
      paymentMethod: paymentMethod || 'credit_card',
      bookingStatus: 'confirmed',
      specialRequirements: specialRequirements || ''
    };
    
    // Always add package ID if it was provided
    // This is important because the frontend expects the package ID to be present
    if (packageId) {
      bookingData.package = packageId;
      console.log('Added package ID to booking data:', packageId);
    }
    
    console.log('Creating booking with data:', bookingData);
    
    // Create the booking
    const booking = await Booking.create(bookingData);
    
    // Update package bookingCount if package exists
    if (selectedPackage) {
      try {
        selectedPackage.bookingCount = (selectedPackage.bookingCount || 0) + Number(numberOfTickets);
        await selectedPackage.save();
        console.log('Updated package booking count to:', selectedPackage.bookingCount);
      } catch (error) {
        console.error('Error updating package booking count:', error);
        // Continue even if this fails
      }
    }

    if (booking) {
      // Add user to event attendees
      for (let i = 0; i < numberOfTickets; i++) {
        if (i === 0) {
          // Add current user as primary attendee
          event.attendees.push({
            user: req.user._id,
            status: 'confirmed',
            bookingDate: Date.now(),
          });
        } else if (attendees && attendees.length > 0) {
          // Add additional attendees if provided
          // For simplicity, we're just adding placeholders. In a real system, these would be handled differently
          event.attendees.push({
            user: req.user._id, // Using same user ID for additional tickets
            status: 'confirmed',
            bookingDate: Date.now(),
          });
        }
      }

      await event.save();

      // Create notification for event organizer
      await Notification.create({
        recipient: event.organizer,
        sender: req.user._id,
        event: event._id,
        booking: booking._id,
        type: 'booking_confirmation',
        title: 'New Booking',
        message: `${req.user.name} has booked ${numberOfTickets} ticket(s) for your event "${event.title}"`,
        redirectUrl: `/bookings/${booking._id}`,
      });

      // Create notification for user
      await Notification.create({
        recipient: req.user._id,
        event: event._id,
        booking: booking._id,
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        message: `Your booking for "${event.title}" has been confirmed. ${appointmentTime ? `Your appointment is scheduled for ${format(new Date(appointmentTime), 'PPPp')}` : ''}`,
        redirectUrl: `/bookings/${booking._id}`,
      });

      res.status(201).json(booking);
    } else {
      res.status(400);
      throw new Error('Invalid booking data');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all bookings for user
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'event',
        select: 'title date time location eventImage',
      })
      .populate({
        path: 'package',
        select: 'name price',
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'event',
        select: 'title description date time endTime location address eventImage organizer',
        populate: {
          path: 'organizer',
          select: 'name email phone',
        },
      })
      .populate('package')
      .populate('user', 'name email');

    // Check if booking exists
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Check if user is authorized to view this booking
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.event.organizer._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to view this booking');
    }

    res.json(booking);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    // Check if booking exists
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Check if user is authorized to cancel this booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to cancel this booking');
    }

    // Check if booking is already cancelled
    if (booking.bookingStatus === 'cancelled') {
      res.status(400);
      throw new Error('Booking is already cancelled');
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    // Get event to update attendees
    const event = await Event.findById(booking.event);
    
    // Update package bookingCount if booking had a package
    if (booking.package) {
      const packageDoc = await Package.findById(booking.package);
      if (packageDoc) {
        packageDoc.bookingCount = Math.max(0, packageDoc.bookingCount - booking.numberOfTickets);
        await packageDoc.save();
      }
    }
    
    if (event) {
      // Remove user from attendees
      event.attendees = event.attendees.filter(
        (a) => a.user.toString() !== req.user._id.toString()
      );
      await event.save();

      // Create notification for organizer
      await Notification.create({
        recipient: event.organizer,
        sender: req.user._id,
        event: event._id,
        booking: booking._id,
        type: 'booking_cancellation',
        title: 'Booking Cancelled',
        message: `${req.user.name} has cancelled their booking for your event "${event.title}"`,
        redirectUrl: `/bookings/${booking._id}`,
      });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get bookings for organizer events
// @route   GET /api/bookings/organizer
// @access  Private/Organizer
const getOrganizerBookings = async (req, res) => {
  try {
    // Get all events created by organizer
    const events = await Event.find({ organizer: req.user._id }).select('_id');
    const eventIds = events.map((event) => event._id);

    // Get bookings for those events
    const bookings = await Booking.find({ event: { $in: eventIds } })
      .populate({
        path: 'event',
        select: 'title date time',
      })
      .populate('user', 'name email phone')
      .populate('package', 'name price')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update booking status (for organizers/admins)
// @route   PUT /api/bookings/:id/status
// @access  Private/Organizer
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Get the event to check if user is organizer
    const event = await Event.findById(booking.event);
    
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // Check if user is authorized to update this booking
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to update this booking');
    }

    // Update booking status
    booking.bookingStatus = status;
    await booking.save();

    // Update attendee status in event
    const attendeeIndex = event.attendees.findIndex(
      (a) => a.user.toString() === booking.user.toString()
    );

    if (attendeeIndex !== -1) {
      event.attendees[attendeeIndex].status = status;
      await event.save();
    }

    // Create notification for user
    await Notification.create({
      recipient: booking.user,
      sender: req.user._id,
      event: event._id,
      booking: booking._id,
      type: 'booking_confirmation',
      title: 'Booking Status Updated',
      message: `Your booking status for "${event.title}" has been updated to ${status}`,
      redirectUrl: `/bookings/${booking._id}`,
    });

    res.json({ message: `Booking status updated to ${status}` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Schedule appointment for booking
// @route   PUT /api/bookings/:id/appointment
// @access  Private
const scheduleAppointment = async (req, res) => {
  try {
    const { appointmentTime } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Check if user is authorized to schedule appointment for this booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to schedule appointment for this booking');
    }

    // Update appointment time
    booking.appointmentTime = appointmentTime;
    await booking.save();

    // Create notification for organizer
    const event = await Event.findById(booking.event);
    if (event) {
      await Notification.create({
        recipient: event.organizer,
        sender: req.user._id,
        event: event._id,
        booking: booking._id,
        type: 'appointment_scheduled',
        title: 'Appointment Scheduled',
        message: `${req.user.name} has scheduled an appointment for ${format(new Date(appointmentTime), 'PPPp')} for your event "${event.title}"`,
        redirectUrl: `/bookings/${booking._id}`,
      });
    }

    res.json({ message: 'Appointment scheduled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getOrganizerBookings,
  updateBookingStatus,
  scheduleAppointment,
};
