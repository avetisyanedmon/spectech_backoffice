const { createOrder } = require("../../src/services/orders.service");
const { validateCreateOrderPayload } = require("../../src/validators/orders.validator");
const { ordersRepository } = require("../../src/repositories/orders.repository");

describe("orders.service createOrder", () => {
  beforeEach(() => {
    ordersRepository.reset();
  });

  it("creates order from new payload style", () => {
    const payload = validateCreateOrderPayload({
      equipmentCategory: "dump_truck",
      city: "  Москва ",
      address: " Ленина, д. 15 ",
      paymentTypes: ["cash", "nds"],
      pricingUnit: "per_hour",
      workVolume: "12.5",
      startDateTime: "2026-03-03T10:30:00.000Z",
      durationHours: "4",
      description: " Нужен самосвал "
    });

    const result = createOrder(payload, "user-1");

    expect(result.equipmentCategory).toBe("dump_truck");
    expect(result.paymentTypes).toEqual(["cash", "nds"]);
    expect(result.pricingUnit).toBe("per_hour");
    expect(result.workVolume).toBe(12.5);
    expect(result.durationHours).toBe(4);
    expect(result.creatorId).toBe("user-1");
    expect(result.address).toBe("Ленина, д. 15");
  });

  it("creates order from legacy payload style", () => {
    const payload = validateCreateOrderPayload({
      equipmentCategory: "Самосвал",
      city: "Казань",
      street: "Баумана",
      houseNumber: "10",
      paymentTypes: ["Наличные"],
      pricingUnit: "за час",
      workVolume: 8,
      startDate: "2026-03-03",
      startTime: "12:30",
      adDuration: 2,
      expiryDateTime: "2099-01-01T10:00:00.000Z",
      description: "Тест"
    });

    const result = createOrder(payload, "user-2");

    expect(result.equipmentCategory).toBe("dump_truck");
    expect(result.pricingUnit).toBe("per_hour");
    expect(result.paymentTypes).toEqual(["cash"]);
    expect(result.durationHours).toBe(2);
    expect(result.address).toBe("Баумана, д. 10");
  });

  it("maps RU labels to canonical enums", () => {
    const payload = validateCreateOrderPayload({
      equipmentCategory: "Кран",
      city: "Ереван",
      address: "Пушкина, д. 1",
      paymentTypes: ["УСН", "С НДС"],
      pricingUnit: "за смену",
      workVolume: 3,
      startDateTime: "2026-03-03T10:30:00.000Z",
      durationHours: 1,
      description: "test"
    });

    const result = createOrder(payload, "user-3");
    expect(result.equipmentCategory).toBe("crane");
    expect(result.paymentTypes).toEqual(["usn", "nds"]);
    expect(result.pricingUnit).toBe("per_shift");
  });

  it("throws on invalid workVolume", () => {
    const payload = validateCreateOrderPayload({
      equipmentCategory: "dump_truck",
      city: "Москва",
      address: "Ленина, д. 1",
      paymentTypes: ["cash"],
      pricingUnit: "per_hour",
      workVolume: 0,
      startDateTime: "2026-03-03T10:30:00.000Z",
      durationHours: 2,
      description: "test"
    });

    expect(() => createOrder(payload, "user-4")).toThrow("Invalid request payload");
  });

  it("throws on invalid datetime", () => {
    const payload = validateCreateOrderPayload({
      equipmentCategory: "dump_truck",
      city: "Москва",
      address: "Ленина, д. 1",
      paymentTypes: ["cash"],
      pricingUnit: "per_hour",
      workVolume: 2,
      startDateTime: "not-a-date",
      durationHours: 2,
      description: "test"
    });

    expect(() => createOrder(payload, "user-5")).toThrow("Invalid request payload");
  });
});
