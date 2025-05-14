import request from "supertest";
import app from "../app.js"; // Adjust the path to your app file

describe("App Tests", () => {
  it("should return 200 for the home route", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
  });
});
