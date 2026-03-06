const { db } = require("../db/database");

class OrdersRepository {
  create(order) {
    db.prepare(
      `
      INSERT INTO orders (
        id,
        creator_id,
        equipment_category,
        city,
        address,
        payment_types,
        pricing_unit,
        work_volume,
        start_date_time,
        duration_hours,
        expires_at,
        description,
        status,
        bid_count,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @creatorId,
        @equipmentCategory,
        @city,
        @address,
        @paymentTypes,
        @pricingUnit,
        @workVolume,
        @startDateTime,
        @durationHours,
        @expiresAt,
        @description,
        @status,
        @bidCount,
        @createdAt,
        @updatedAt
      )
      `
    ).run({
      ...order,
      paymentTypes: JSON.stringify(order.paymentTypes)
    });

    return order;
  }

  findAll() {
    const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    return rows.map((row) => this.#mapRow(row));
  }

  findById(id) {
    const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    return row ? this.#mapRow(row) : null;
  }

  findByCreatorId(creatorId) {
    const rows = db
      .prepare("SELECT * FROM orders WHERE creator_id = ? ORDER BY created_at DESC")
      .all(creatorId);
    return rows.map((row) => this.#mapRow(row));
  }

  incrementBidCount(id) {
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE orders SET bid_count = bid_count + 1, updated_at = ? WHERE id = ?"
    ).run(now, id);
  }

  reset() {
    db.prepare("DELETE FROM orders").run();
  }

  #mapRow(row) {
    return {
      id: row.id,
      creatorId: row.creator_id,
      equipmentCategory: row.equipment_category,
      city: row.city,
      address: row.address,
      paymentTypes: JSON.parse(row.payment_types || "[]"),
      pricingUnit: row.pricing_unit,
      workVolume: row.work_volume,
      startDateTime: row.start_date_time,
      durationHours: row.duration_hours,
      expiresAt: row.expires_at,
      description: row.description,
      status: row.status,
      bidCount: row.bid_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const ordersRepository = new OrdersRepository();

module.exports = { ordersRepository };
