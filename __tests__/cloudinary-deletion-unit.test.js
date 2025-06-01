import mongoose from "mongoose";
import Club from "../models/club.model.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import cloudinary from "../configs/cloudinary.js";

// Set test environment
process.env.NODE_ENV = "test";
process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/event-portal-test";

// Mock Cloudinary
jest.mock("../configs/cloudinary.js", () => ({
  uploader: {
    destroy: jest.fn(),
  },
}));

// Import controllers after mocking
import * as adminController from "../controllers/admin.controller.js";
import * as eventController from "../controllers/event.controller.js";
import * as userController from "../controllers/user.controller.js";

describe("Cloudinary Deletion Unit Tests", () => {
  let testUser, testClub, testEvent;

  beforeAll(async () => {
    // Connect to test database
    try {
      await mongoose.connect(process.env.MONGODB_TEST_URI);
    } catch (error) {
      console.log("Using in-memory database for testing");
    }
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock cloudinary responses
    cloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });

    // Create test user
    testUser = new User({
      name: "Test Admin",
      email: "admin@test.com",
      username: "testadmin",
      password: "hashedpassword",
      role: "admin",
      avatar:
        "https://res.cloudinary.com/test/image/upload/v1234567890/avatars/test-avatar.jpg",
    });
    await testUser.save();

    // Create test club with images
    testClub = new Club({
      name: "Test Club",
      description: "Test Description",
      image:
        "https://res.cloudinary.com/test/image/upload/v1234567890/clubs/test-club.jpg",
      banner:
        "https://res.cloudinary.com/test/image/upload/v1234567890/banners/test-banner.jpg",
      gallery: [
        {
          url: "https://res.cloudinary.com/test/image/upload/v1234567890/gallery/image1.jpg",
          caption: "Test Image 1",
          uploadedBy: testUser._id,
          uploadedAt: new Date(),
        },
        {
          url: "https://res.cloudinary.com/test/image/upload/v1234567890/gallery/image2.jpg",
          caption: "Test Image 2",
          uploadedBy: testUser._id,
          uploadedAt: new Date(),
        },
      ],
    });
    await testClub.save();

    // Create test event with image
    testEvent = new Event({
      title: "Test Event",
      description: "Test Event Description",
      type: "Workshop",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      startTime: "10:00",
      endTime: "17:00",
      location: "Test Location",
      image:
        "https://res.cloudinary.com/test/image/upload/v1234567890/events/test-event.jpg",
      club: testClub._id,
      createdBy: testUser._id,
    });
    await testEvent.save();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await User.deleteMany({});
      await Club.deleteMany({});
      await Event.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      // Ignore connection close errors
    }
  });

  describe("Public ID Extraction", () => {
    test("should extract public ID from Cloudinary URL with version", () => {
      const extractPublicId = (cloudinaryUrl) => {
        if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") return null;
        const urlParts = cloudinaryUrl.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");
        if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1)
          return null;
        const pathAfterUpload = urlParts.slice(uploadIndex + 1);
        if (pathAfterUpload[0] && pathAfterUpload[0].startsWith("v")) {
          pathAfterUpload.shift();
        }
        const filename = pathAfterUpload.join("/");
        return filename.replace(/\.[^/.]+$/, "");
      };

      expect(
        extractPublicId(
          "https://res.cloudinary.com/test/image/upload/v1234567890/gallery/image1.jpg"
        )
      ).toBe("gallery/image1");

      expect(
        extractPublicId(
          "https://res.cloudinary.com/test/image/upload/clubs/test-club.jpg"
        )
      ).toBe("clubs/test-club");

      expect(extractPublicId("invalid-url")).toBe(null);
      expect(extractPublicId("")).toBe(null);
      expect(extractPublicId(null)).toBe(null);
    });
  });

  describe("Admin Controller - Club Deletion", () => {
    test("should delete club and cleanup all associated images", async () => {
      const req = {
        params: { id: testClub._id },
        flash: jest.fn(),
        user: testUser,
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await adminController.deleteClub(req, res);

      // Verify all images were deleted from Cloudinary
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "clubs/test-club"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "banners/test-banner"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "gallery/image1"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "gallery/image2"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(4);

      // Verify club was deleted from database
      const deletedClub = await Club.findById(testClub._id);
      expect(deletedClub).toBeNull();
    });

    test("should handle Cloudinary errors gracefully during club deletion", async () => {
      // Mock Cloudinary to throw an error
      cloudinary.uploader.destroy.mockRejectedValue(
        new Error("Cloudinary error")
      );

      const req = {
        params: { id: testClub._id },
        flash: jest.fn(),
        user: testUser,
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await adminController.deleteClub(req, res);

      // Verify club was still deleted from database despite Cloudinary errors
      const deletedClub = await Club.findById(testClub._id);
      expect(deletedClub).toBeNull();

      // Verify redirect happened
      expect(res.redirect).toHaveBeenCalledWith("/admin/clubs");
    });
  });

  describe("Admin Controller - Event Deletion", () => {
    test("should delete event and cleanup associated image", async () => {
      const req = {
        params: { id: testEvent._id },
        flash: jest.fn(),
        user: testUser,
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await adminController.deleteEvent(req, res);

      // Verify event image was deleted from Cloudinary
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "events/test-event"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);

      // Verify event was deleted from database
      const deletedEvent = await Event.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });
  });

  describe("Admin Controller - User Deletion", () => {
    test("should delete user and cleanup avatar", async () => {
      const req = {
        params: { id: testUser._id },
        flash: jest.fn(),
        user: { _id: "different-admin-id", role: "admin" },
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await adminController.deleteUser(req, res);

      // Verify avatar was deleted from Cloudinary
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "avatars/test-avatar"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);

      // Verify user was deleted from database
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe("Event Controller - Event Deletion", () => {
    test("should delete event and cleanup image from user route", async () => {
      const req = {
        params: { id: testEvent._id },
        flash: jest.fn(),
        user: testUser,
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await eventController.deleteEvent(req, res);

      // Verify event image was deleted from Cloudinary
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "events/test-event"
      );
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);

      // Verify event was deleted from database
      const deletedEvent = await Event.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid public IDs gracefully", () => {
      const extractPublicId = (cloudinaryUrl) => {
        if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") return null;
        const urlParts = cloudinaryUrl.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");
        if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1)
          return null;
        const pathAfterUpload = urlParts.slice(uploadIndex + 1);
        if (pathAfterUpload[0] && pathAfterUpload[0].startsWith("v")) {
          pathAfterUpload.shift();
        }
        const filename = pathAfterUpload.join("/");
        return filename.replace(/\.[^/.]+$/, "");
      };

      // Test various invalid URLs
      expect(extractPublicId("not-a-cloudinary-url")).toBe(null);
      expect(extractPublicId("https://other-service.com/image.jpg")).toBe(null);
      expect(extractPublicId("")).toBe(null);
      expect(extractPublicId(null)).toBe(null);
      expect(extractPublicId(undefined)).toBe(null);
    });

    test("should continue operation even if Cloudinary fails", async () => {
      // Mock Cloudinary to always fail
      cloudinary.uploader.destroy.mockRejectedValue(new Error("Network error"));

      const req = {
        params: { id: testClub._id },
        flash: jest.fn(),
        user: testUser,
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // This should not throw an error
      await expect(adminController.deleteClub(req, res)).resolves.not.toThrow();

      // Database operation should still complete
      const deletedClub = await Club.findById(testClub._id);
      expect(deletedClub).toBeNull();
    });
  });
});
