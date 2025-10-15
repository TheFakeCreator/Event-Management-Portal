import mongoose from 'mongoose';
import debug from 'debug';

const log = debug('app:db');

interface DatabaseConfig {
  mongoURI: string;
  options: mongoose.ConnectOptions;
}

const config: DatabaseConfig = {
  mongoURI:
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/event-management-portal',
  options: {
    // Modern mongoose connection options
    bufferCommands: false,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  },
};

/**
 * Establishes connection to MongoDB database
 * @returns Promise<typeof mongoose> - Connected mongoose instance
 */
export const connectToDatabase = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(config.mongoURI, config.options);
    console.log('Connected to MongoDB successfully!');
    log('Connected to MongoDB successfully!');

    // Connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      log('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      log('MongoDB reconnected');
    });

    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', (error as Error).message);
    log('Error connecting to MongoDB:', (error as Error).message);
    process.exit(1);
  }
};

/**
 * Gracefully close database connection
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    log('MongoDB connection closed');
  } catch (error) {
    console.error(
      'Error closing MongoDB connection:',
      (error as Error).message
    );
    log('Error closing MongoDB connection:', (error as Error).message);
  }
};

// Auto-connect when this module is imported
connectToDatabase();

export default mongoose.connection;
