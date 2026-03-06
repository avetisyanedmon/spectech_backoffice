const request = require("supertest");
const { app } = require("../../src/app");
const { buildBearerToken } = require("../helpers/auth");
const { ordersRepository } = require("../../src/repositories/orders.repository");

describe("POST /api/orders e2e", () => {
  beforeEach(() => {
    ordersRepository.reset();
  });

  it("creates normalized order successfully", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "creator-1", role: "customer" }))
      .send({
        equipmentCategory: "Самосвал",
        city: " Москва ",
        street: " Ленина ",
        houseNumber: " 15 ",
        paymentTypes: ["Наличные", "С НДС"],
        pricingUnit: "за час",
        workVolume: "15.2",
        startDate: "2026-03-03",
        startTime: "10:30",
        adDuration: "3",
        expiryDateTime: "2099-01-01T00:00:00.000Z",
        description: " Нужна техника "
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeTruthy();
    expect(response.body.data.creatorId).toBe("creator-1");
    expect(response.body.data.equipmentCategory).toBe("dump_truck");
    expect(response.body.data.pricingUnit).toBe("per_hour");
    expect(response.body.data.paymentTypes).toEqual(["cash", "nds"]);
    expect(response.body.data.workVolume).toBe(15.2);
    expect(response.body.data.durationHours).toBe(3);
    expect(response.body.data.status).toBe("open");
    expect(response.body.data.bidCount).toBe(0);
    expect(response.body.data.expiryDateTime).toBe(response.body.data.expiresAt);
  });
});
