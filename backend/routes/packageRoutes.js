const express = require('express');
const router = express.Router();
const {
  createPackage,
  getEventPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');
const { protect, organizer } = require('../middleware/authMiddleware');

// Public routes
router.get('/event/:eventId', getEventPackages);
router.get('/:id', getPackageById);

// Organizer routes
router.post('/', protect, organizer, createPackage);
router.put('/:id', protect, organizer, updatePackage);
router.delete('/:id', protect, organizer, deletePackage);

module.exports = router;
