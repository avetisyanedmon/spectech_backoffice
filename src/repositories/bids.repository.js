const { db } = require("../db/database");

class BidsRepository {
  create(bid) {
    db.prepare(
      `
      INSERT INTO bids (
        id,
        order_id,
        contractor_id,
        price,
        delivery_price,
        payment_type,
        comment,
        equipment_id,
        equipment_name,
        equipment_category,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @orderId,
        @contractorId,
        @price,
        @deliveryPrice,
        @paymentType,
        @comment,
        @equipmentId,
        @equipmentName,
        @equipmentCategory,
        @createdAt,
        @updatedAt
      )
      `
    ).run(bid);

    return bid;
  }

  findByOrderId(orderId) {
    const rows = db
      .prepare("SELECT * FROM bids WHERE order_id = ? ORDER BY created_at ASC")
      .all(orderId);
    return rows.map((row) => this.#mapRow(row));
  }

  findOrderIdsByContractorId(contractorId) {
    const rows = db
      .prepare("SELECT DISTINCT order_id FROM bids WHERE contractor_id = ?")
      .all(contractorId);
    return rows.map((r) => r.order_id);
  }

  #mapRow(row) {
    return {
      id: row.id,
      orderId: row.order_id,
      contractorId: row.contractor_id,
      userId: row.contractor_id,
      price: row.price,
      deliveryPrice: row.delivery_price,
      paymentType: row.payment_type,
      comment: row.comment,
      equipmentId: row.equipment_id,
      equipmentName: row.equipment_name,
      equipmentCategory: row.equipment_category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.created_at,
    };
  }
}

const bidsRepository = new BidsRepository();

module.exports = { bidsRepository };
