import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import Club from "../models/club.model.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import cloudinary from "../configs/cloudinary.js";

// Set test environment
process.env.NODE_ENV = "test";
process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/event-portal-test";
process.env.SESSION_SECRET = "test-secret";

// Mock Cloudinary
jest.mock("../configs/cloudinary.js", () => ({
  uploader: {
    destroy: jest.fn(),
  },
}));

describe("Cloudinary Deletion Tests", () => {
  let testUser, testClub, testEvent;
  let authAgent;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_TEST_URI ||
        "mongodb://localhost:27017/event-portal-test"
    );
  });
  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

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
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: new Date(Date.now() + 172800000), // Day after tomorrow
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
    await User.deleteMany({});
    await Club.deleteMany({});
    await Event.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("Club Gallery Image Deletion", () => {
    test("should delete image from Cloudinary when deleting gallery image", async () => {
      const galleryImageId = testClub.gallery[0]._id;

      const response = await authAgent
        .post(`/club/${testClub._id}/gallery/${galleryImageId}/delete`)
        .expect(302); // Redirect after deletion

      // Verify Cloudinary deletion was called with correct public_id
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "gallery/image1"
      );

      // Verify image was removed from database
      const updatedClub = await Club.findById(testClub._id);
      expect(updatedClub.gallery).toHaveLength(1);
      expect(updatedClub.gallery[0].url).not.toContain("image1.jpg");
    });

    test("should handle Cloudinary deletion failure gracefully", async () => {
      // Mock Cloudinary to throw an error
      cloudinary.uploader.destroy.mockRejectedValueOnce(
        new Error("Cloudinary error")
      );

      const galleryImageId = testClub.gallery[0]._id;

      const response = await authAgent
        .post(`/club/${testClub._id}/gallery/${galleryImageId}/delete`)
        .expect(302); // Should still redirect successfully

      // Verify Cloudinary deletion was attempted
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "gallery/image1"
      );

      // Verify image was still removed from database despite Cloudinary failure
      const updatedClub = await Club.findById(testClub._id);
      expect(updatedClub.gallery).toHaveLength(1);
    });
  });

  describe("Club Display Image Deletion", () => {
    test("should delete display image from Cloudinary", async () => {
      const response = await authAgent
        .post(`/club/${testClub._id}/image/delete`)
        .expect(302);

      // Verify Cloudinary deletion was called with correct public_id
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "clubs/test-club"
      );

      // Verify image was removed from database
      const updatedClub = await Club.findById(testClub._id);
      expect(updatedClub.image).toBeUndefined();
    });
  });

  describe("Complete Club Deletion (Admin)", () => {
    test("should delete all club images from Cloudinary when deleting entire club", async () => {
      const response = await authAgent
        .post(`/admin/clubs/delete/${testClub._id}`)
        .expect(302);

      // Verify all images were deleted from Cloudinary
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(4); // display + banner + 2 gallery images
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

      // Verify club was deleted from database
      const deletedClub = await Club.findById(testClub._id);
      expect(deletedClub).toBeNull();
    });

    test("should handle mixed Cloudinary deletion results", async () => {
      // Mock some deletions to succeed and some to fail
      cloudinary.uploader.destroy
        .mockResolvedValueOnce({ result: "ok" }) // display image - success
        .mockRejectedValueOnce(new Error("Not found")) // banner - fail
        .mockResolvedValueOnce({ result: "ok" }) // gallery image 1 - success
        .mockRejectedValueOnce(new Error("Timeout")); // gallery image 2 - fail

      const response = await authAgent
        .post(`/admin/clubs/delete/${testClub._id}`)
        .expect(302);

      // Verify all deletions were attempted
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(4);

      // Verify club was still deleted from database
      const deletedClub = await Club.findById(testClub._id);
      expect(deletedClub).toBeNull();
    });
  });

  describe("Event Deletion", () => {
    test("should delete event image from Cloudinary (admin deletion)", async () => {
      const response = await authAgent
        .post(`/admin/events/delete/${testEvent._id}`)
        .expect(302);

      // Verify Cloudinary deletion was called
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "events/test-event"
      );

      // Verify event was deleted from database
      const deletedEvent = await Event.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });

    test("should delete event image from Cloudinary (creator deletion)", async () => {
      const response = await authAgent
        .post(`/event/${testEvent._id}/delete`)
        .expect(302);

      // Verify Cloudinary deletion was called
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "events/test-event"
      );

      // Verify event was deleted from database
      const deletedEvent = await Event.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });
  });

  describe("User Avatar Cleanup", () => {
    test("should delete user avatar from Cloudinary when user is deleted", async () => {
      const response = await authAgent
        .post(`/admin/users/delete/${testUser._id}`)
        .expect(302);

      // Verify Cloudinary deletion was called
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "avatars/test-avatar"
      );

      // Verify user was deleted from database
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    test("should clean up old avatar when user updates profile picture", async () => {
      // Mock file upload
      const response = await authAgent
        .post(`/user/edit`)
        .attach("avatar", Buffer.from("fake image data"), "new-avatar.jpg")
        .field("name", "Updated Name")
        .field("username", "updatedusername")
        .expect(302);

      // Verify old avatar was deleted from Cloudinary
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "avatars/test-avatar"
      );
    });
  });

  describe("Public ID Extraction", () => {
    test("should extract public ID from various Cloudinary URL formats", () => {
      // Import the helper function for testing
      // Note: This would require exporting the function from the controllers
      const { extractPublicId } = require("../controllers/admin.controller.js");

      // Test URLs with version
      expect(
        extractPublicId(
          "https://res.cloudinary.com/test/image/upload/v1234567890/folder/image.jpg"
        )
      ).toBe("folder/image");

      // Test URLs without version
      expect(
        extractPublicId(
          "https://res.cloudinary.com/test/image/upload/folder/image.jpg"
        )
      ).toBe("folder/image");

      // Test nested folders
      expect(
        extractPublicId(
          "https://res.cloudinary.com/test/image/upload/v1234567890/folder/subfolder/image.png"
        )
      ).toBe("folder/subfolder/image");

      // Test invalid URLs
      expect(extractPublicId("invalid-url")).toBeNull();
      expect(extractPublicId("")).toBeNull();
      expect(extractPublicId(null)).toBeNull();
    });
  });

  describe("Error Handling", () => {
    test("should continue with database operations when Cloudinary is unavailable", async () => {
      // Mock Cloudinary to be completely unavailable
      cloudinary.uploader.destroy.mockImplementation(() => {
        throw new Error("Service unavailable");
      });

      const galleryImageId = testClub.gallery[0]._id;

      const response = await authAgent
        .post(`/club/${testClub._id}/gallery/${galleryImageId}/delete`)
        .expect(302);

      // Verify image was still removed from database
      const updatedClub = await Club.findById(testClub._id);
      expect(updatedClub.gallery).toHaveLength(1);
    });

    test("should handle malformed image URLs gracefully", async () => {
      // Create club with malformed image URL
      const clubWithBadUrl = new Club({
        name: "Bad URL Club",
        description: "Test",
        image: "not-a-valid-cloudinary-url",
      });
      await clubWithBadUrl.save();

      const response = await authAgent
        .post(`/admin/clubs/delete/${clubWithBadUrl._id}`)
        .expect(302);

      // Should not attempt Cloudinary deletion for invalid URLs
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();

      // Should still delete from database
      const deletedClub = await Club.findById(clubWithBadUrl._id);
      expect(deletedClub).toBeNull();
    });
  });
});
