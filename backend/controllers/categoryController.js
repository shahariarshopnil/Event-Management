const Category = require('../models/categoryModel');
const Event = require('../models/eventModel');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Check if category exists
    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      res.status(400);
      throw new Error('Category already exists');
    }

    // Create category
    const category = await Category.create({
      name,
      description,
      color,
      icon: req.file ? req.file.filename : 'default-category.png',
    });

    if (category) {
      res.status(201).json(category);
    } else {
      res.status(400);
      throw new Error('Invalid category data');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      res.json(category);
    } else {
      res.status(404);
      throw new Error('Category not found');
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.description = description || category.description;
      category.color = color || category.color;
      
      if (req.file) {
        category.icon = req.file.filename;
      }

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404);
      throw new Error('Category not found');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Check if category is being used by events
    const eventsWithCategory = await Event.countDocuments({ category: req.params.id });
    
    if (eventsWithCategory > 0) {
      res.status(400);
      throw new Error('Cannot delete category that has events');
    }

    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get category events
// @route   GET /api/categories/:id/events
// @access  Public
const getCategoryEvents = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    const count = await Event.countDocuments({ category: req.params.id });
    const events = await Event.find({ category: req.params.id })
      .populate('organizer', 'name')
      .sort({ date: 1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Get category details
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.json({
      category,
      events,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryEvents,
};
