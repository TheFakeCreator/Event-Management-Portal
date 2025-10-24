import mongoose from "mongoose";
import Event from "../models/event.model.js";
import Club from "../models/club.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import Log from "../models/log.model.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/user.model.js";
import { OptimizedQueries, QueryOptimizer } from "../utils/queryOptimizer.js";
import { EventCache, CacheInvalidator } from "../middlewares/cacheMiddleware.js";
import { ImageOptimizer } from "../utils/imageOptimizer.js";
import { dbPerformanceMonitor } from "../middlewares/performanceMiddleware.js";

// Helper function to extract public_id from Cloudinary URL (unchanged)
const extractPublicId = (cloudinaryUrl) => {
    try {
        if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") {
            return null;
        }

        const urlParts = cloudinaryUrl.split("/");
        const uploadIndex = urlParts.indexOf("upload");

        if (uploadIndex === -1) {
            return null;
        }

        let pathAfterUpload = urlParts.slice(uploadIndex + 1);

        if (pathAfterUpload.length > 0 && /^v\d+$/.test(pathAfterUpload[0])) {
            pathAfterUpload = pathAfterUpload.slice(1);
        }

        const fullPath = pathAfterUpload.join("/");
        const publicId = fullPath.replace(/\.[^.]+$/, "");

        return publicId || null;
    } catch (error) {
        console.error("Error extracting public_id from Cloudinary URL:", error);
        return null;
    }
};

export const getEvents = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sort || 'startDate';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        // Build filters
        const filters = {};
        if (req.query.type) {
            filters.Type = req.query.type;
        }
        if (req.query.club) {
            filters.club = new mongoose.Types.ObjectId(req.query.club);
        }
        if (req.query.upcoming === 'true') {
            filters.startDate = { $gte: new Date() };
        }

        // Try cache first
        const cacheKey = `events:list:${page}:${limit}:${JSON.stringify(filters)}:${sortBy}:${sortOrder}`;
        let cachedEvents = await EventCache.getEventsList(page, limit, { ...filters, sortBy, sortOrder });

        if (cachedEvents && req.headers['cache-control'] !== 'no-cache') {
            console.log('📦 Serving events from cache');

            return res.render("eventsPage", {
                title: "Event Management Portal",
                events: cachedEvents,
                user,
                isAuthenticated: req.isAuthenticated,
                success: req.flash("success"),
                error: req.flash("error"),
                pagination: {
                    currentPage: page,
                    hasNext: cachedEvents.length === limit,
                    hasPrev: page > 1
                }
            });
        }

        // Database query with performance monitoring
        const eventsData = await dbPerformanceMonitor.monitorQuery(
            'getEventsList',
            async () => {
                // Use optimized query
                const query = OptimizedQueries.getEventsQuery(filters, {
                    page,
                    limit,
                    sort: { [sortBy]: sortOrder },
                    populateClub: true,
                    populateRegistrations: false
                });

                const events = await query.lean(); // Use lean for better performance

                // Get registration counts efficiently using aggregation
                const eventIds = events.map(e => e._id);
                const registrationCounts = await EventRegistration.aggregate([
                    { $match: { event: { $in: eventIds } } },
                    {
                        $group: {
                            _id: '$event',
                            count: { $sum: 1 },
                            users: {
                                $push: {
                                    name: '$name',
                                    email: '$email'
                                }
                            }
                        }
                    },
                    {
                        $addFields: {
                            recentUsers: { $slice: ['$users', 5] }
                        }
                    }
                ]);

                // Create lookup map
                const regMap = {};
                registrationCounts.forEach(reg => {
                    regMap[reg._id.toString()] = {
                        count: reg.count,
                        users: reg.recentUsers
                    };
                });

                // Process events for response
                const processedEvents = events.map(e => {
                    const regData = regMap[e._id.toString()] || { count: 0, users: [] };

                    return {
                        id: e._id,
                        title: e.title,
                        image: e.image,
                        startDate: e.startDate,
                        endDate: e.endDate,
                        startTime: e.startTime,
                        location: e.location,
                        club: e.club ? { id: e.club._id, name: e.club.name } : undefined,
                        registeredUsers: regData.users,
                        registeredUsersCount: regData.count,
                    };
                });

                return processedEvents;
            }
        );

        // Cache the results
        await EventCache.setEventsList(
            page,
            limit,
            { ...filters, sortBy, sortOrder },
            eventsData,
            300 // 5 minutes cache
        );

        res.render("eventsPage", {
            title: "Event Management Portal",
            events: eventsData,
            user,
            isAuthenticated: req.isAuthenticated,
            success: req.flash("success"),
            error: req.flash("error"),
            pagination: {
                currentPage: page,
                hasNext: eventsData.length === limit,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).send("Error fetching events");
    }
};

export const getCreateEvent = async (req, res) => {
    try {
        const user = req.user;

        // Cache clubs data
        const cachedClubs = await EventCache.get(`clubs:for_event_creation:${user._id}`);

        let clubs;
        if (cachedClubs) {
            clubs = cachedClubs;
        } else {
            clubs = await dbPerformanceMonitor.monitorQuery(
                'getClubsForEventCreation',
                () => Club.find({})
                    .populate("currentMembers", "name email")
                    .populate("moderators", "name email")
                    .lean()
            );

            // Cache clubs data for 10 minutes
            await EventCache.set(`clubs:for_event_creation:${user._id}`, clubs, 600);
        }

        res.render("createEvent", {
            title: "Create Event",
            clubs,
            user,
            isAuthenticated: req.isAuthenticated,
        });
    } catch (error) {
        console.error("❌ Error fetching clubs:", error);
        res.status(500).send("Error fetching clubs");
    }
};

export const getEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id;

        // Try cache first
        let eventData = await EventCache.getEvent(eventId);

        if (!eventData || req.headers['cache-control'] === 'no-cache') {
            eventData = await dbPerformanceMonitor.monitorQuery(
                'getEventDetails',
                async () => {
                    const event = await OptimizedQueries.getEventDetailsQuery(eventId);

                    if (!event) {
                        return null;
                    }

                    // Get registration info efficiently
                    const [registrationCount, userRegistration] = await Promise.all([
                        EventRegistration.countDocuments({ event: eventId }),
                        req.user ? EventRegistration.findOne({
                            event: eventId,
                            user: req.user._id
                        }).lean() : null
                    ]);

                    return {
                        ...event,
                        registeredUsersCount: registrationCount,
                        alreadyRegistered: !!userRegistration
                    };
                }
            );

            if (eventData) {
                // Cache event details for 10 minutes
                await EventCache.setEvent(eventId, eventData, 600);
            }
        }

        if (!eventData) {
            req.flash("error", "Event not found");
            return res.redirect("/event");
        }

        const creator = req.user && eventData.createdBy.toString() === req.user._id.toString();

        res.render("eventDetails", {
            title: "Event Details",
            event: eventData,
            user: req.user,
            isAuthenticated: req.isAuthenticated,
            registeredUsersCount: eventData.registeredUsersCount,
            creator,
            alreadyRegistered: eventData.alreadyRegistered,
            success: req.flash("success"),
            error: req.flash("error"),
        });
    } catch (error) {
        console.error("❌ Error fetching event details:", error);
        req.flash("error", "Server Error");
        res.redirect("/event");
    }
};

export const getEventRegister = async (req, res) => {
    try {
        const eventId = req.params.id;

        // Get event from cache or database
        let event = await EventCache.getEvent(eventId);

        if (!event) {
            event = await dbPerformanceMonitor.monitorQuery(
                'getEventForRegistration',
                () => Event.findById(eventId).lean()
            );

            if (event) {
                await EventCache.setEvent(eventId, event, 300);
            }
        }

        if (!event) {
            return res.status(404).send("Event not found");
        }

        // Check if the event has already started
        if (new Date() >= new Date(event.startDate)) {
            return res.status(403).render("registrationClose", {
                event,
                title: "Event Registration",
                isAuthenticated: req.isAuthenticated,
                user: req.user,
            });
        }

        res.render("eventRegister", {
            event,
            title: "Event Registration",
            isAuthenticated: req.isAuthenticated,
            user: req.user,
        });
    } catch (error) {
        console.error("❌ Error fetching event for registration:", error);
        res.status(500).send("Server Error");
    }
};

export const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            location,
            club,
            collaborators,
            eventLeads,
            sponsors,
        } = req.body;

        // Validation
        if (
            !title ||
            !description ||
            !type ||
            !startDate ||
            !endDate ||
            !startTime ||
            !endTime ||
            !location ||
            !club
        ) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Use optimized image if available from middleware
        const imageUrl = req.optimizedImages?.originalUrl || req.body.image;

        if (!imageUrl) {
            return res.status(400).json({ message: "Event image is required." });
        }

        // Process arrays
        let collaboratorsArray = [];
        if (collaborators) {
            try {
                const parsedCollaborators = JSON.parse(collaborators);
                if (Array.isArray(parsedCollaborators)) {
                    collaboratorsArray = parsedCollaborators.map(
                        (id) => new mongoose.Types.ObjectId(id)
                    );
                }
            } catch (error) {
                return res.status(400).json({ message: "Invalid collaborators format." });
            }
        }

        let eventLeadsArray = [];
        if (eventLeads) {
            try {
                const parsedEventLeads = JSON.parse(eventLeads);
                if (Array.isArray(parsedEventLeads)) {
                    eventLeadsArray = parsedEventLeads.map(
                        (id) => new mongoose.Types.ObjectId(id)
                    );
                }
            } catch (error) {
                console.log("Error parsing event leads:", error);
            }
        }

        let sponsorsArray = [];
        if (sponsors) {
            try {
                const parsedSponsors = JSON.parse(sponsors);
                if (Array.isArray(parsedSponsors)) {
                    sponsorsArray = parsedSponsors.filter(
                        (sponsor) => sponsor.name && sponsor.name.trim()
                    );
                }
            } catch (error) {
                console.log("Error parsing sponsors:", error);
            }
        }

        const event = await dbPerformanceMonitor.monitorQuery(
            'createEvent',
            async () => {
                const newEvent = await Event.create({
                    title,
                    description,
                    type,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    location,
                    image: imageUrl,
                    club,
                    createdBy: req.user._id,
                    collaborators: collaboratorsArray,
                    eventLeads: eventLeadsArray,
                    sponsors: sponsorsArray,
                });

                // Create log entry
                await Log.create({
                    user: req.user._id,
                    action: "CREATE",
                    targetType: "EVENT",
                    targetId: newEvent._id,
                    details: `Event ${newEvent.title} created by ${req.user.name}`,
                });

                return newEvent;
            }
        );

        // Invalidate relevant caches
        await Promise.all([
            EventCache.invalidateEvent(event._id),
            CacheInvalidator.invalidateEvents(),
            CacheInvalidator.invalidateByPattern(`clubs:for_event_creation:*`)
        ]);

        req.flash("success", "Event created successfully!");
        res.redirect("/event");
    } catch (error) {
        console.error("❌ Error creating event:", error);
        req.flash("error", "Failed to create event.");
        res.redirect("/event");
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await dbPerformanceMonitor.monitorQuery(
            'getEventForDeletion',
            () => Event.findById(id).lean()
        );

        if (!event) {
            req.flash("error", "Event not found");
            return res.redirect("/event");
        }

        // Check authorization
        if (
            event.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            req.flash("error", "You are not authorized to delete this event.");
            return res.redirect(`/event/${id}`);
        }

        await dbPerformanceMonitor.monitorQuery(
            'deleteEvent',
            async () => {
                // Delete image from Cloudinary
                const publicId = extractPublicId(event.image);
                if (publicId) {
                    try {
                        await ImageOptimizer.deleteCloudinaryImages([publicId]);
                    } catch (error) {
                        console.error("Error deleting image from Cloudinary:", error);
                    }
                }

                // Delete event and related data
                await Promise.all([
                    Event.findByIdAndDelete(id),
                    EventRegistration.deleteMany({ event: id }),
                    Log.create({
                        user: req.user._id,
                        action: "DELETE",
                        targetType: "EVENT",
                        targetId: id,
                        details: `Event ${event.title} deleted by ${req.user.name}`,
                    })
                ]);
            }
        );

        // Invalidate caches
        await Promise.all([
            EventCache.invalidateEvent(id),
            CacheInvalidator.invalidateEvents()
        ]);

        req.flash("success", "Event deleted successfully!");
        res.redirect("/event");
    } catch (error) {
        console.error("❌ Error deleting event:", error);
        req.flash("error", "Failed to delete event.");
        res.redirect("/event");
    }
};

export const registerEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { name, email, phone } = req.body;

        const event = await dbPerformanceMonitor.monitorQuery(
            'getEventForRegistration',
            () => Event.findById(eventId).lean()
        );

        if (!event) {
            req.flash("error", "Event not found");
            return res.redirect("/event");
        }

        if (new Date() >= new Date(event.startDate)) {
            req.flash("error", "Registration is closed for this event.");
            return res.redirect(`/event/${eventId}`);
        }

        // Check for duplicate registration
        const alreadyRegistered = await dbPerformanceMonitor.monitorQuery(
            'checkDuplicateRegistration',
            () => EventRegistration.findOne({
                event: eventId,
                email: email.trim().toLowerCase(),
            }).lean()
        );

        if (alreadyRegistered) {
            req.flash("error", "You have already registered for this event.");
            return res.redirect(`/event/${eventId}`);
        }

        await dbPerformanceMonitor.monitorQuery(
            'createEventRegistration',
            async () => {
                // Create registration and update event count
                await Promise.all([
                    EventRegistration.create({
                        event: eventId,
                        name,
                        email: email.trim().toLowerCase(),
                        phone,
                        user: req.user ? req.user._id : undefined,
                    }),
                    Event.findByIdAndUpdate(eventId, { $inc: { registeredUsers: 1 } })
                ]);
            }
        );

        // Send confirmation email asynchronously
        setImmediate(async () => {
            try {
                await sendEmail(
                    email.trim().toLowerCase(),
                    `Registration Confirmation for ${event.title}`,
                    `Hello ${name},\n\nYou have successfully registered for the event: ${event.title}.\n\nEvent Details:\nDate: ${event.startDate}\nTime: ${event.startTime} - ${event.endTime}\nLocation: ${event.location}\n\nThank you for registering!\n\nEvent Management Portal`
                );
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
            }
        });

        // Invalidate event cache
        await EventCache.invalidateEvent(eventId);

        req.flash("success", "Successfully registered for the event!");
        res.redirect(`/event/${eventId}`);
    } catch (error) {
        console.error("❌ Error registering for event:", error);
        req.flash("error", "Failed to register for the event.");
        res.redirect(`/event/${req.params.id}`);
    }
};

// Export remaining functions with similar optimizations...
export { editEvent, getEditEvent, getEventParticipants, reportEvent, addEventWinners };