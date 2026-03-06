const { validateCreateOrderPayload } = require("../../src/validators/orders.validator");

describe("orders.validator", () => {
  it("fails when paymentTypes is missing", () => {
    expect(() =>
      validateCreateOrderPayload({
        equipmentCategory: "dump_truck",
        city: "Москва",
        address: "Ленина, д. 1",
        pricingUnit: "per_hour",
        workVolume: 3,
        startDateTime: "2026-03-03T10:30:00.000Z",
        durationHours: 2,
        description: "test"
      })
    ).toThrow("Invalid request payload");
  });
});
