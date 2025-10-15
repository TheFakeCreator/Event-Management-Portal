import mongoose from 'mongoose';
import { env, isDevelopment } from './env.config.js';

/**
 * Connect to MongoDB database
 */
export async function connectDatabase(): Promise<void> {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Connection options
    const options = {
      dbName: env.DB_NAME,
      retryWrites: true,
      w: 'majority' as const,
    };

    // Connect to database
    const connection = await mongoose.connect(
      env.DATABASE_URL || `mongodb://localhost:27017/${env.DB_NAME}`,
      options
    );

    console.log(
      `✅ Connected to MongoDB: ${connection.connection.host}:${connection.connection.port}/${connection.connection.name}`
    );

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get database connection status
 */
export function getDatabaseStatus(): string {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}
