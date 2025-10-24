import mongoose from 'mongoose';

/**
 * Database optimization utilities for improved query performance
 */
export class QueryOptimizer {
    /**
     * Create compound indexes for common queries
     */
    static async createOptimalIndexes() {
        try {
            const collections = mongoose.connection.collections;

            // Event model indexes
            if (collections.events) {
                await collections.events.createIndex({ startDate: 1, endDate: 1 }); // Date range queries
                await collections.events.createIndex({ 'club': 1, startDate: -1 }); // Club events sorted by date
                await collections.events.createIndex({ createdBy: 1, createdAt: -1 }); // User's events
                await collections.events.createIndex({ Type: 1, startDate: 1 }); // Event type filtering
                await collections.events.createIndex({
                    'title': 'text',
                    'description': 'text'
                }, {
                    name: 'event_text_search',
                    default_language: 'english'
                }); // Text search
                await collections.events.createIndex({ 'location': 1 }); // Location-based queries
                await collections.events.createIndex({ 'registeredUsers': -1 }); // Popular events
            }

            // Event Registration indexes
            if (collections.eventregistrations) {
                await collections.eventregistrations.createIndex({ event: 1, user: 1 }, { unique: true }); // Prevent duplicate registrations
                await collections.eventregistrations.createIndex({ event: 1, registeredAt: -1 }); // Event participants
                await collections.eventregistrations.createIndex({ user: 1, registeredAt: -1 }); // User registrations
                await collections.eventregistrations.createIndex({ email: 1, event: 1 }); // Email uniqueness per event
            }

            // User model indexes
            if (collections.users) {
                await collections.users.createIndex({ email: 1 }, { unique: true }); // Unique email
                await collections.users.createIndex({ role: 1, createdAt: -1 }); // Role-based queries
                await collections.users.createIndex({ 'name': 'text' }); // Name search
                await collections.users.createIndex({ lastLogin: -1 }); // Active users
            }

            // Club model indexes
            if (collections.clubs) {
                await collections.clubs.createIndex({ 'name': 'text', 'description': 'text' }); // Club search
                await collections.clubs.createIndex({ currentMembers: 1 }); // Member queries
                await collections.clubs.createIndex({ moderators: 1 }); // Moderator queries
                await collections.clubs.createIndex({ createdAt: -1 }); // Latest clubs
            }

            // Log model indexes
            if (collections.logs) {
                await collections.logs.createIndex({ user: 1, createdAt: -1 }); // User activity
                await collections.logs.createIndex({ targetType: 1, targetId: 1, createdAt: -1 }); // Entity logs
                await collections.logs.createIndex({ action: 1, createdAt: -1 }); // Action-based filtering
                await collections.logs.createIndex({ createdAt: -1 }); // Time-based queries
            }

            console.log('✅ Database indexes created successfully');
        } catch (error) {
            console.error('❌ Error creating database indexes:', error);
        }
    }

    /**
     * Analyze query performance
     */
    static async analyzeQuery(model, query) {
        try {
            const explainPlan = await model.find(query).explain('executionStats');

            return {
                totalDocsExamined: explainPlan.executionStats.totalDocsExamined,
                totalDocsReturned: explainPlan.executionStats.totalDocsReturned,
                executionTimeMillis: explainPlan.executionStats.executionTimeMillis,
                indexesUsed: explainPlan.executionStats.indexesUsed || [],
                isOptimal: explainPlan.executionStats.totalDocsExamined === explainPlan.executionStats.totalDocsReturned
            };
        } catch (error) {
            console.error('❌ Query analysis error:', error);
            return null;
        }
    }

    /**
     * Get database statistics
     */
    static async getDatabaseStats() {
        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            const stats = {};

            for (const collection of collections) {
                const collectionStats = await db.collection(collection.name).stats();
                stats[collection.name] = {
                    documents: collectionStats.count,
                    avgDocSize: collectionStats.avgObjSize,
                    totalSize: collectionStats.size,
                    indexes: collectionStats.nindexes,
                    indexSize: collectionStats.totalIndexSize
                };
            }

            return stats;
        } catch (error) {
            console.error('❌ Database stats error:', error);
            return {};
        }
    }
}

/**
 * Optimized query builders for common operations
 */
export class OptimizedQueries {
    /**
     * Get events with optimized population and filtering
     */
    static getEventsQuery(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = { startDate: -1 },
            populateClub = true,
            populateRegistrations = false
        } = options;

        const skip = (page - 1) * limit;
        let query = mongoose.model('Event').find(filters);

        // Apply sorting
        query = query.sort(sort);

        // Apply pagination
        query = query.skip(skip).limit(limit);

        // Selective population to reduce data transfer
        if (populateClub) {
            query = query.populate('club', 'name description image');
        }

        // Only populate registrations if needed (expensive operation)
        if (populateRegistrations) {
            query = query.populate({
                path: 'registrations',
                select: 'user registeredAt',
                populate: {
                    path: 'user',
                    select: 'name avatar'
                },
                options: { limit: 5 } // Limit to first 5 for display
            });
        }

        return query;
    }

    /**
     * Get event details with all required data in single query
     */
    static getEventDetailsQuery(eventId) {
        return mongoose.model('Event')
            .findById(eventId)
            .populate('club', 'name description image website socialMedia')
            .populate('collaborators', 'name image')
            .populate('eventLeads', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .lean(); // Use lean() for read-only operations
    }

    /**
     * Get user's registered events efficiently
     */
    static getUserEventsQuery(userId, options = {}) {
        const { upcoming = false, limit = 10 } = options;

        let dateFilter = {};
        if (upcoming) {
            dateFilter = { startDate: { $gte: new Date() } };
        }

        return mongoose.model('EventRegistration')
            .find({ user: userId })
            .populate({
                path: 'event',
                match: dateFilter,
                select: 'title description startDate endDate startTime location image club',
                populate: {
                    path: 'club',
                    select: 'name'
                }
            })
            .sort({ registeredAt: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Get club events with registration counts
     */
    static getClubEventsQuery(clubId, options = {}) {
        const {
            includeRegistrationCount = true,
            limit = 10,
            sort = { startDate: -1 }
        } = options;

        const pipeline = [
            { $match: { club: new mongoose.Types.ObjectId(clubId) } },
            { $sort: sort },
            { $limit: limit }
        ];

        if (includeRegistrationCount) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'eventregistrations',
                        localField: '_id',
                        foreignField: 'event',
                        as: 'registrations'
                    }
                },
                {
                    $addFields: {
                        actualRegistrationCount: { $size: '$registrations' }
                    }
                },
                {
                    $project: {
                        registrations: 0 // Remove the joined array to save bandwidth
                    }
                }
            );
        }

        return mongoose.model('Event').aggregate(pipeline);
    }

    /**
     * Search events with text search and filters
     */
    static searchEventsQuery(searchTerm, filters = {}, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const pipeline = [
            // Text search stage
            {
                $match: {
                    $and: [
                        searchTerm ? { $text: { $search: searchTerm } } : {},
                        filters
                    ]
                }
            },
            // Add text score for relevance sorting
            searchTerm ? { $addFields: { score: { $meta: 'textScore' } } } : { $addFields: {} },
            // Sort by relevance and date
            {
                $sort: searchTerm
                    ? { score: { $meta: 'textScore' }, startDate: -1 }
                    : { startDate: -1 }
            },
            // Pagination
            { $skip: skip },
            { $limit: limit },
            // Join with clubs
            {
                $lookup: {
                    from: 'clubs',
                    localField: 'club',
                    foreignField: '_id',
                    as: 'clubInfo'
                }
            },
            {
                $addFields: {
                    club: { $arrayElemAt: ['$clubInfo', 0] }
                }
            },
            {
                $project: {
                    clubInfo: 0,
                    score: 0 // Remove score from final output
                }
            }
        ];

        return mongoose.model('Event').aggregate(pipeline);
    }
}

/**
 * Connection pooling and monitoring
 */
export class DatabaseMonitor {
    static async getConnectionStats() {
        try {
            const db = mongoose.connection.db;
            const admin = db.admin();

            const serverStatus = await admin.serverStatus();

            return {
                connections: {
                    current: serverStatus.connections.current,
                    available: serverStatus.connections.available,
                    totalCreated: serverStatus.connections.totalCreated
                },
                operations: {
                    insert: serverStatus.opcounters.insert,
                    query: serverStatus.opcounters.query,
                    update: serverStatus.opcounters.update,
                    delete: serverStatus.opcounters.delete
                },
                memory: {
                    resident: serverStatus.mem.resident,
                    virtual: serverStatus.mem.virtual,
                    mapped: serverStatus.mem.mapped
                },
                uptime: serverStatus.uptime
            };
        } catch (error) {
            console.error('❌ Database monitor error:', error);
            return {};
        }
    }

    static async getSlowQueries(threshold = 100) {
        try {
            const db = mongoose.connection.db;

            // Enable profiling for slow operations
            await db.admin().command({ profile: 2, slowms: threshold });

            // Get slow queries from system.profile collection
            const slowQueries = await db.collection('system.profile')
                .find({
                    ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                })
                .sort({ ts: -1 })
                .limit(10)
                .toArray();

            return slowQueries.map(query => ({
                namespace: query.ns,
                operation: query.op,
                duration: query.millis,
                timestamp: query.ts,
                command: query.command
            }));
        } catch (error) {
            console.error('❌ Slow queries error:', error);
            return [];
        }
    }
}

/**
 * Batch operations for bulk processing
 */
export class BatchOperations {
    static async bulkUpdateEventRegistrations() {
        try {
            // Update registration counts for all events
            const pipeline = [
                {
                    $group: {
                        _id: '$event',
                        count: { $sum: 1 }
                    }
                }
            ];

            const registrationCounts = await mongoose.model('EventRegistration')
                .aggregate(pipeline);

            const bulkOps = registrationCounts.map(item => ({
                updateOne: {
                    filter: { _id: item._id },
                    update: { $set: { registeredUsers: item.count } }
                }
            }));

            if (bulkOps.length > 0) {
                const result = await mongoose.model('Event').bulkWrite(bulkOps);
                console.log(`✅ Updated ${result.modifiedCount} event registration counts`);
                return result.modifiedCount;
            }

            return 0;
        } catch (error) {
            console.error('❌ Bulk update error:', error);
            return 0;
        }
    }

    static async cleanupOldLogs(daysOld = 90) {
        try {
            const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));

            const result = await mongoose.model('Log').deleteMany({
                createdAt: { $lt: cutoffDate }
            });

            console.log(`✅ Cleaned up ${result.deletedCount} old log entries`);
            return result.deletedCount;
        } catch (error) {
            console.error('❌ Log cleanup error:', error);
            return 0;
        }
    }
}