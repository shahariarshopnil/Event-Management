const Package = require('../models/packageModel');
const Event = require('../models/eventModel');

// @desc    Create a new package
// @route   POST /api/packages
// @access  Private/Organizer
const createPackage = async (req, res) => {
  try {
    const { name, description, price, features, event, maxBookings } = req.body;

    // Check if event exists and user is the organizer
    const eventDoc = await Event.findById(event);
    if (!eventDoc) {
      res.status(404);
      throw new Error('Event not found');
    }

    if (eventDoc.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to create packages for this event');
    }

    // Create package
    const package = await Package.create({
      name,
      description,
      price,
      features: features.split(',').map(feature => feature.trim()),
      event,
      maxBookings,
      isActive: true,
    });

    if (package) {
      // Add package to event's available packages
      eventDoc.availablePackages.push(package._id);
      await eventDoc.save();

      res.status(201).json(package);
    } else {
      res.status(400);
      throw new Error('Invalid package data');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all packages for an event
// @route   GET /api/packages/event/:eventId
// @access  Public
const getEventPackages = async (req, res) => {
  try {
    // Find packages for this event
    const packages = await Package.find({ 
      event: req.params.eventId,
      isActive: true
    }).sort({ price: 1 });

    // Get booking counts from the database and calculate availability
    const packagesWithAvailability = packages.map(pkg => {
      // Convert to plain object
      const packageObj = pkg.toObject();
      
      // Calculate available bookings
      packageObj.availableBookings = Math.max(0, packageObj.maxBookings - (packageObj.bookingCount || 0));
      
      return packageObj;
    });

    res.json(packagesWithAvailability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get package by ID
// @route   GET /api/packages/:id
// @access  Public
const getPackageById = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (package) {
      res.json(package);
    } else {
      res.status(404);
      throw new Error('Package not found');
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update a package
// @route   PUT /api/packages/:id
// @access  Private/Organizer
const updatePackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      res.status(404);
      throw new Error('Package not found');
    }

    // Check if user is the event organizer
    const event = await Event.findById(package.event);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this package');
    }

    // Update package
    const { name, description, price, features, maxBookings, isActive } = req.body;

    package.name = name || package.name;
    package.description = description || package.description;
    package.price = price || package.price;
    
    if (features) {
      package.features = features.split(',').map(feature => feature.trim());
    }
    
    if (maxBookings) {
      package.maxBookings = maxBookings;
    }
    
    if (isActive !== undefined) {
      package.isActive = isActive;
    }

    const updatedPackage = await package.save();
    res.json(updatedPackage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a package
// @route   DELETE /api/packages/:id
// @access  Private/Organizer
const deletePackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      res.status(404);
      throw new Error('Package not found');
    }

    // Check if user is the event organizer
    const event = await Event.findById(package.event);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this package');
    }

    // Remove package from event's available packages
    event.availablePackages = event.availablePackages.filter(
      p => p.toString() !== package._id.toString()
    );
    await event.save();

    // Delete package
    await package.remove();
    res.json({ message: 'Package removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createPackage,
  getEventPackages,
  getPackageById,
  updatePackage,
  deletePackage,
};
