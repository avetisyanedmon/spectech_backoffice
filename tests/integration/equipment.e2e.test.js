const request = require("supertest");
const { app } = require("../../src/app");
const { buildBearerToken } = require("../helpers/auth");
const { equipmentRepository } = require("../../src/repositories/equipment.repository");

const validPayload = {
  name: " CAT 320 ",
  category: "excavator",
  characteristics: " Мощный экскаватор ",
  additionalEquipment: " Гидромолот ",
  photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"]
};

describe("Equipment endpoints", () => {
  beforeEach(() => {
    equipmentRepository.reset();
  });

  it("POST /api/equipment success with valid payload", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-1", role: "contractor" }))
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeTruthy();
    expect(response.body.data.name).toBe("CAT 320");
    expect(response.body.data.category).toBe("excavator");
    expect(response.body.data.characteristics).toBe("Мощный экскаватор");
    expect(response.body.data.additionalEquipment).toBe("Гидромолот");
    expect(response.body.data.photos).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg"
    ]);
    expect(response.body.data.ownerId).toBe("owner-1");
  });

  it("POST /api/equipment returns 400 for missing required fields", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-1", role: "contractor" }))
      .send({ category: "excavator" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/equipment returns 400 for invalid category", async () => {
    const response = await request(app)
      .post("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-1", role: "contractor" }))
      .send({
        name: "Test",
        category: "truck",
        characteristics: "Specs"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/equipment returns 401 without token", async () => {
    const response = await request(app).post("/api/equipment").send(validPayload);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/equipment returns only current user items", async () => {
    await request(app)
      .post("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-1", role: "contractor" }))
      .send(validPayload);

    await request(app)
      .post("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-2", role: "contractor" }))
      .send({ ...validPayload, name: "Komatsu" });

    const response = await request(app)
      .get("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-1", role: "contractor" }));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].ownerId).toBe("owner-1");
    expect(Array.isArray(response.body.data[0].photos)).toBe(true);
  });

  it("GET /api/equipment returns 401 without token", async () => {
    const response = await request(app).get("/api/equipment");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for forbidden role", async () => {
    const response = await request(app)
      .get("/api/equipment")
      .set("Authorization", buildBearerToken({ id: "owner-1", role: "viewer" }));

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
