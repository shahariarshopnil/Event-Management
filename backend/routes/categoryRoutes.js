const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryEvents,
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.get('/:id/events', getCategoryEvents);

// Admin routes
router.post('/', protect, admin, upload.single('categoryIcon'), createCategory);
router.put('/:id', protect, admin, upload.single('categoryIcon'), updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
