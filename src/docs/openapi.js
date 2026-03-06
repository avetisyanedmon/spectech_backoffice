const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SpecTech Backoffice API",
    version: "1.0.0"
  },
  paths: {
    "/api/equipment": {
      post: {
        summary: "Create equipment",
        description: "Adds equipment item owned by authenticated user.",
        tags: ["Equipment"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "category", "characteristics"],
                properties: {
                  name: { type: "string", maxLength: 120, example: "CAT 320" },
                  category: {
                    type: "string",
                    enum: [
                      "dump_truck",
                      "excavator",
                      "loader",
                      "bulldozer",
                      "crane",
                      "grader",
                      "compactor",
                      "other"
                    ],
                    example: "excavator"
                  },
                  characteristics: {
                    type: "string",
                    maxLength: 2000,
                    example: "Гусеничный, 25 тонн"
                  },
                  additionalEquipment: {
                    type: "string",
                    maxLength: 1000,
                    example: "Гидромолот"
                  },
                  photos: {
                    type: "array",
                    maxItems: 4,
                    items: { type: "string" },
                    example: [
                      "https://example.com/photo1.jpg",
                      "https://example.com/photo2.jpg"
                    ]
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Equipment created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      $ref: "#/components/schemas/EquipmentItem"
                    }
                  }
                }
              }
            }
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" }
        }
      },
      get: {
        summary: "Get my equipment",
        description: "Returns equipment owned by current user sorted by newest first.",
        tags: ["Equipment"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Equipment list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/EquipmentItem" }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" }
        }
      }
    },
    "/api/orders": {
      get: {
        summary: "Get orders",
        description:
          "Returns orders list. Optional query `view` supports `all`, `mine`, or `marketplace` (all except current user's orders).",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "view",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["all", "mine", "marketplace"],
              default: "all"
            },
            description:
              "View mode for returned orders: all orders, only mine, or marketplace (exclude my own)."
          }
        ],
        responses: {
          200: {
            description: "Orders list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          equipmentCategory: { type: "string", example: "dump_truck" },
                          city: { type: "string", example: "Москва" },
                          address: { type: "string", example: "Ленина, д. 15" },
                          paymentTypes: { type: "array", items: { type: "string" } },
                          pricingUnit: { type: "string", example: "per_hour" },
                          workVolume: { type: "number", example: 6 },
                          startDateTime: { type: "string", format: "date-time" },
                          durationHours: { type: "integer", example: 4 },
                          expiresAt: { type: "string", format: "date-time" },
                          expiryDateTime: { type: "string", format: "date-time" },
                          status: { type: "string", example: "open" },
                          bidCount: { type: "integer", example: 0 },
                          creatorId: { type: "string", example: "user-123" },
                          createdAt: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized"
          },
          403: {
            description: "Forbidden"
          }
        }
      },
      post: {
        summary: "Create order",
        description: "Creates a normalized order from legacy or new payload styles.",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "equipmentCategory",
                  "city",
                  "paymentTypes",
                  "pricingUnit",
                  "workVolume",
                  "description"
                ],
                properties: {
                  equipmentCategory: { type: "string", example: "Самосвал" },
                  city: { type: "string", example: "Москва" },
                  street: { type: "string", example: "Ленина" },
                  houseNumber: { type: "string", example: "15" },
                  address: { type: "string", example: "Ленина, д. 15" },
                  paymentTypes: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Наличные", "НДС"]
                  },
                  pricingUnit: { type: "string", example: "за час" },
                  workVolume: { oneOf: [{ type: "number" }, { type: "string" }], example: 6 },
                  startDate: { type: "string", format: "date", example: "2026-03-03" },
                  startTime: { type: "string", example: "10:30" },
                  startDateTime: { type: "string", format: "date-time" },
                  adDuration: { oneOf: [{ type: "number" }, { type: "string" }], example: 4 },
                  durationHours: {
                    oneOf: [{ type: "integer" }, { type: "string" }],
                    example: 4
                  },
                  description: { type: "string", example: "Нужен самосвал на вывоз грунта" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Order created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        equipmentCategory: { type: "string", example: "dump_truck" },
                        city: { type: "string", example: "Москва" },
                        address: { type: "string", example: "Ленина, д. 15" },
                        paymentTypes: {
                          type: "array",
                          items: { type: "string" },
                          example: ["cash", "nds"]
                        },
                        pricingUnit: { type: "string", example: "per_hour" },
                        workVolume: { type: "number", example: 6 },
                        startDateTime: { type: "string", format: "date-time" },
                        durationHours: { type: "integer", example: 4 },
                        expiresAt: { type: "string", format: "date-time" },
                        expiryDateTime: { type: "string", format: "date-time" },
                        status: { type: "string", example: "open" },
                        bidCount: { type: "integer", example: 0 },
                        creatorId: { type: "string", example: "user-123" },
                        createdAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error"
          },
          401: {
            description: "Unauthorized"
          },
          403: {
            description: "Forbidden"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      EquipmentItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "CAT 320" },
          category: {
            type: "string",
            enum: [
              "dump_truck",
              "excavator",
              "loader",
              "bulldozer",
              "crane",
              "grader",
              "compactor",
              "other"
            ]
          },
          characteristics: { type: "string", example: "Гусеничный, 25 тонн" },
          additionalEquipment: { type: "string", example: "Гидромолот" },
          photos: {
            type: "array",
            items: { type: "string" },
            example: ["https://example.com/photo.jpg"]
          },
          ownerId: { type: "string", example: "user-123" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
};

module.exports = { openApiSpec };
