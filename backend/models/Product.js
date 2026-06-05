const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  images: [{
    type: String
  }],
  available: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = require('../utils/firebaseModel').models.Product;
