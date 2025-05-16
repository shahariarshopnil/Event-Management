const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    icon: {
      type: String,
      default: 'default-category.png',
    },
    color: {
      type: String,
      default: '#3498db',
    },
    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);
