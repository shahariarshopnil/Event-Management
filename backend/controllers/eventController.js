const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Package = require('../models/packageModel');
const Notification = require('../models/notificationModel');
const { format } = require('date-fns');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Organizer
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      date,
      endDate,
      time,
      endTime,
      location,
      address,
      city,
      state,
      zipCode,
      country,
      category,
      price,
      maxAttendees,
      tags,
      packages: packagesJson,
    } = req.body;

    // Parse packages if present
    let packages = [];
    if (packagesJson) {
      try {
        packages = JSON.parse(packagesJson);
      } catch (error) {
        console.error('Error parsing packages:', error);
      }
    }

    // Validate price
    if (!price || price < 1) {
      return res.status(400).json({ message: 'Please set a valid price for the event (minimum 1)' });
    }

    // Create event
    const event = await Event.create({
      title,
      description,
      shortDescription: shortDescription || `${title} - ${location}`, // Default if not provided
      date,
      endDate: endDate || date,
      time,
      endTime: endTime || time,
      location,
      address,
      city,
      state: state || '',
      zipCode: zipCode || '',
      country: country || 'Bangladesh', // Default if not provided
      category,
      organizer: req.user._id,
      price: price || 0,
      maxAttendees,
      eventImage: req.file ? req.file.filename : 'default-event.jpg',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    if (event) {
      // Create packages if provided
      if (packages && packages.length > 0) {
        const packagePromises = packages.map(pkg => {
          return Package.create({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            features: pkg.features,
            event: event._id,
            maxBookings: pkg.maxBookings,
            isActive: pkg.isActive !== false,
          });
        });

        // Create all packages
        const createdPackages = await Promise.all(packagePromises);
        
        // Add package IDs to the event's availablePackages array
        event.availablePackages = createdPackages.map(pkg => pkg._id);
        await event.save();
      }

      // Notify subscribers of the category
      const categorySubscribers = await User.find({
        'subscriptions.category': category,
      });

      // Create notifications for subscribers
      if (categorySubscribers.length > 0) {
        const notificationPromises = categorySubscribers.map(subscriber => {
          return Notification.create({
            recipient: subscriber._id,
            sender: req.user._id,
            event: event._id,
            type: 'new_subscription',
            title: 'New Event in Your Subscribed Category',
            message: `A new event "${event.title}" has been added in a category you follow.`,
            redirectUrl: `/events/${event._id}`,
          });
        });

        await Promise.all(notificationPromises);
      }

      // Fetch the event with populated packages for the response
      const populatedEvent = await Event.findById(event._id).populate('availablePackages');
      res.status(201).json(populatedEvent);
    } else {
      res.status(400);
      throw new Error('Invalid event data');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    const keyword = req.query.keyword
      ? {
          title: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    const categoryFilter = req.query.category
      ? { category: req.query.category }
      : {};

    const dateFilter = req.query.date
      ? { date: { $gte: new Date(req.query.date) } }
      : {};

    const priceFilter = req.query.maxPrice
      ? { price: { $lte: Number(req.query.maxPrice) } }
      : {};

    const statusFilter = req.query.status
      ? { status: req.query.status }
      : {};

    const filter = {
      ...keyword,
      ...categoryFilter,
      ...dateFilter,
      ...priceFilter,
      ...statusFilter,
    };

    const count = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('category', 'name')
      .populate('organizer', 'name email')
      .sort({ date: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      events,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get featured events
// @route   GET /api/events/featured
// @access  Public
const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({ featured: true })
      .populate('category', 'name')
      .populate('organizer', 'name')
      .limit(6);

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      date: { $gte: new Date() },
      status: 'upcoming'
    })
      .populate('category', 'name')
      .populate('organizer', 'name')
      .sort({ date: 1 })
      .limit(10);

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('category', 'name description')
      .populate('organizer', 'name email phone')
      .populate('availablePackages')
      .populate({
        path: 'attendees.user',
        select: 'name email',
      });

    if (event) {
      res.json(event);
    } else {
      res.status(404);
      throw new Error('Event not found');
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Organizer
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to update this event');
    }

    // Update event fields
    const updatedFields = { ...req.body };
    
    // Handle image separately if it exists
    if (req.file) {
      updatedFields.eventImage = req.file.filename;
    }

    // Handle tags
    if (req.body.tags) {
      updatedFields.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

    if (updatedEvent) {
      // Notify attendees about event update
      const attendeeIds = event.attendees
        .filter(a => a.status === 'confirmed')
        .map(a => a.user);

      // Create notifications for attendees
      if (attendeeIds.length > 0) {
        const notificationPromises = attendeeIds.map(attendeeId => {
          return Notification.create({
            recipient: attendeeId,
            sender: req.user._id,
            event: event._id,
            type: 'event_update',
            title: 'Event Update',
            message: `The event "${event.title}" has been updated. Please check the details.`,
            redirectUrl: `/events/${event._id}`,
          });
        });

        await Promise.all(notificationPromises);
      }

      res.json(updatedEvent);
    } else {
      res.status(400);
      throw new Error('Failed to update event');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Organizer
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to delete this event');
    }

    // Get attendee IDs for notification
    const attendeeIds = event.attendees
      .filter(a => a.status === 'confirmed')
      .map(a => a.user);

    await event.remove();

    // Notify attendees about event cancellation
    if (attendeeIds.length > 0) {
      const notificationPromises = attendeeIds.map(attendeeId => {
        return Notification.create({
          recipient: attendeeId,
          sender: req.user._id,
          type: 'event_cancelled',
          title: 'Event Cancelled',
          message: `The event "${event.title}" scheduled for ${format(new Date(event.date), 'PPP')} has been cancelled.`,
          redirectUrl: '/events',
        });
      });

      await Promise.all(notificationPromises);
    }

    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get events created by current user
// @route   GET /api/events/myevents
// @access  Private/Organizer
const getMyEvents = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Event.countDocuments({ organizer: req.user._id });
    const events = await Event.find({ organizer: req.user._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      events,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // Check if event is full
    const confirmedAttendees = event.attendees.filter(
      a => a.status === 'confirmed'
    ).length;
    
    if (confirmedAttendees >= event.maxAttendees) {
      res.status(400);
      throw new Error('This event is fully booked');
    }

    // Check if user is already registered
    const alreadyRegistered = event.attendees.find(
      a => a.user.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      res.status(400);
      throw new Error('You are already registered for this event');
    }

    // Add user to attendees
    event.attendees.push({
      user: req.user._id,
      status: 'confirmed',
      bookingDate: Date.now(),
    });

    await event.save();

    // Create notification for event organizer
    await Notification.create({
      recipient: event.organizer,
      sender: req.user._id,
      event: event._id,
      type: 'booking_confirmation',
      title: 'New Event Registration',
      message: `${req.user.name} has registered for your event "${event.title}".`,
      redirectUrl: `/events/${event._id}`,
    });

    res.status(201).json({ message: 'Successfully registered for event' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel registration for an event
// @route   POST /api/events/:id/cancel
// @access  Private
const cancelEventRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // Find attendee
    const attendeeIndex = event.attendees.findIndex(
      a => a.user.toString() === req.user._id.toString()
    );

    if (attendeeIndex === -1) {
      res.status(400);
      throw new Error('You are not registered for this event');
    }

    // Remove attendee
    event.attendees.splice(attendeeIndex, 1);
    await event.save();

    // Create notification for event organizer
    await Notification.create({
      recipient: event.organizer,
      sender: req.user._id,
      event: event._id,
      type: 'booking_cancellation',
      title: 'Registration Cancelled',
      message: `${req.user.name} has cancelled their registration for your event "${event.title}".`,
      redirectUrl: `/events/${event._id}`,
    });

    res.status(200).json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get events user is attending
// @route   GET /api/events/attending
// @access  Private
const getAttendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      'attendees.user': req.user._id,
      'attendees.status': 'confirmed',
    })
      .populate('category', 'name')
      .populate('organizer', 'name email')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};
