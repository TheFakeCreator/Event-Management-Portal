// =============================================================================
// MongoDB Initialization Script
// Event Management Portal - Database Setup
// =============================================================================

// Switch to the event_management database
db = db.getSiblingDB('event_management');

// Create application user
db.createUser({
    user: 'app_user',
    pwd: 'app_password_change_in_production',
    roles: [
        {
            role: 'readWrite',
            db: 'event_management'
        }
    ]
});

// Create collections with validation schemas
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'name', 'createdAt'],
            properties: {
                email: {
                    bsonType: 'string',
                    description: 'User email address'
                },
                name: {
                    bsonType: 'string',
                    description: 'User full name'
                },
                role: {
                    enum: ['user', 'admin', 'moderator'],
                    description: 'User role'
                },
                isActive: {
                    bsonType: 'bool',
                    description: 'User active status'
                },
                createdAt: {
                    bsonType: 'date',
                    description: 'User creation date'
                }
            }
        }
    }
});

db.createCollection('events', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['title', 'description', 'startDate', 'endDate', 'createdBy', 'createdAt'],
            properties: {
                title: {
                    bsonType: 'string',
                    description: 'Event title'
                },
                description: {
                    bsonType: 'string',
                    description: 'Event description'
                },
                startDate: {
                    bsonType: 'date',
                    description: 'Event start date'
                },
                endDate: {
                    bsonType: 'date',
                    description: 'Event end date'
                },
                status: {
                    enum: ['draft', 'published', 'cancelled', 'completed'],
                    description: 'Event status'
                },
                isActive: {
                    bsonType: 'bool',
                    description: 'Event active status'
                }
            }
        }
    }
});

db.createCollection('clubs', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'description', 'createdBy', 'createdAt'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'Club name'
                },
                description: {
                    bsonType: 'string',
                    description: 'Club description'
                },
                category: {
                    bsonType: 'string',
                    description: 'Club category'
                },
                isActive: {
                    bsonType: 'bool',
                    description: 'Club active status'
                }
            }
        }
    }
});

// Create indexes for performance
// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: 1 });

// Events indexes
db.events.createIndex({ title: 'text', description: 'text' });
db.events.createIndex({ startDate: 1 });
db.events.createIndex({ endDate: 1 });
db.events.createIndex({ status: 1 });
db.events.createIndex({ createdBy: 1 });
db.events.createIndex({ category: 1 });
db.events.createIndex({ isActive: 1 });
db.events.createIndex({ 'location.city': 1 });

// Clubs indexes
db.clubs.createIndex({ name: 'text', description: 'text' });
db.clubs.createIndex({ category: 1 });
db.clubs.createIndex({ createdBy: 1 });
db.clubs.createIndex({ isActive: 1 });
db.clubs.createIndex({ memberCount: 1 });

// Registrations indexes
db.eventregistrations.createIndex({ eventId: 1, userId: 1 }, { unique: true });
db.eventregistrations.createIndex({ userId: 1 });
db.eventregistrations.createIndex({ eventId: 1 });
db.eventregistrations.createIndex({ registrationDate: 1 });

// Announcements indexes
db.announcements.createIndex({ title: 'text', content: 'text' });
db.announcements.createIndex({ createdBy: 1 });
db.announcements.createIndex({ createdAt: 1 });
db.announcements.createIndex({ isActive: 1 });

// Logs indexes
db.logs.createIndex({ userId: 1 });
db.logs.createIndex({ action: 1 });
db.logs.createIndex({ timestamp: 1 });
db.logs.createIndex({ ip: 1 });

print('MongoDB initialization completed successfully!');
print('Created collections: users, events, clubs');
print('Created indexes for optimal performance');
print('Database is ready for production use');