const request = require("supertest");
const { app } = require("../../src/app");

describe("orders auth", () => {
  it("returns unauthorized when auth is missing", async () => {
    const response = await request(app).post("/api/orders").send({
      equipmentCategory: "dump_truck",
      city: "Москва",
      address: "Ленина, д. 1",
      paymentTypes: ["cash"],
      pricingUnit: "per_hour",
      workVolume: 3,
      startDateTime: "2026-03-03T10:30:00.000Z",
      durationHours: 2,
      description: "test"
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
