const request = require("supertest");
const { app } = require("../../src/app");
const { buildBearerToken } = require("../helpers/auth");
const { ordersRepository } = require("../../src/repositories/orders.repository");

const orderPayload = {
  equipmentCategory: "Самосвал",
  city: "Москва",
  address: "Ленина, д. 15",
  paymentTypes: ["Наличные"],
  pricingUnit: "за час",
  workVolume: 10,
  startDateTime: "2026-03-04T10:30:00.000Z",
  durationHours: 2,
  description: "Тест заказ"
};

describe("GET /api/orders e2e", () => {
  beforeEach(() => {
    ordersRepository.reset();
  });

  it("returns all orders by default for customer role", async () => {
    await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-1", role: "customer" }))
      .send(orderPayload);

    await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-2", role: "customer" }))
      .send({ ...orderPayload, description: "Другой заказ" });

    const response = await request(app)
      .get("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-1", role: "customer" }));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  it("returns only creator orders when view=mine", async () => {
    await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-1", role: "customer" }))
      .send(orderPayload);

    await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-2", role: "customer" }))
      .send({ ...orderPayload, description: "Другой заказ" });

    const response = await request(app)
      .get("/api/orders?view=mine")
      .set("Authorization", buildBearerToken({ id: "customer-1", role: "customer" }));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].creatorId).toBe("customer-1");
  });

  it("returns marketplace orders when view=marketplace", async () => {
    await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-1", role: "customer" }))
      .send(orderPayload);

    await request(app)
      .post("/api/orders")
      .set("Authorization", buildBearerToken({ id: "customer-2", role: "customer" }))
      .send({ ...orderPayload, description: "Другой заказ" });

    const response = await request(app)
      .get("/api/orders?view=marketplace")
      .set("Authorization", buildBearerToken({ id: "customer-1", role: "customer" }));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].creatorId).toBe("customer-2");
  });
});
