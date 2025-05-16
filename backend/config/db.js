const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB Atlas connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Don't exit the process immediately in production, allow for retry
    if (process.env.NODE_ENV === 'production') {
      console.error('Connection failed. Application will continue to run and retry connection.');
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
