const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const connectDB = require('../config/db');
require('dotenv').config();

// Sample categories
const sampleCategories = [
  {
    name: 'Conference',
    description: 'Professional conferences, summits and business events',
    color: '#3498db',
    icon: 'default-category.png'
  },
  {
    name: 'Workshop',
    description: 'Interactive learning sessions and hands-on workshops',
    color: '#2ecc71',
    icon: 'default-category.png'
  },
  {
    name: 'Concert',
    description: 'Music performances and live entertainment events',
    color: '#9b59b6',
    icon: 'default-category.png'
  },
  {
    name: 'Exhibition',
    description: 'Art exhibitions, trade shows and display events',
    color: '#e74c3c',
    icon: 'default-category.png'
  },
  {
    name: 'Seminar',
    description: 'Educational and training seminars',
    color: '#f39c12',
    icon: 'default-category.png'
  },
  {
    name: 'Social Gathering',
    description: 'Networking events and social gatherings',
    color: '#1abc9c',
    icon: 'default-category.png'
  }
];

// Import categories to database
const importCategories = async () => {
  try {
    await connectDB();
    
    // Clear existing categories
    await Category.deleteMany({});
    
    // Insert new categories
    await Category.insertMany(sampleCategories);
    
    console.log('Categories imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importCategories();
