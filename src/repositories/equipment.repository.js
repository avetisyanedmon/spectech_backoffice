const { db } = require("../db/database");

class EquipmentRepository {
  create(item) {
    db.prepare(
      `
      INSERT INTO equipment (
        id,
        owner_id,
        name,
        category,
        characteristics,
        additional_equipment,
        photos,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @ownerId,
        @name,
        @category,
        @characteristics,
        @additionalEquipment,
        @photos,
        @createdAt,
        @updatedAt
      )
      `
    ).run({
      ...item,
      photos: JSON.stringify(item.photos || [])
    });

    return item;
  }

  findByOwnerId(ownerId) {
    const rows = db
      .prepare("SELECT * FROM equipment WHERE owner_id = ? ORDER BY created_at DESC")
      .all(ownerId);
    return rows.map((row) => this.#mapRow(row));
  }

  reset() {
    db.prepare("DELETE FROM equipment").run();
  }

  #mapRow(row) {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      category: row.category,
      characteristics: row.characteristics,
      additionalEquipment: row.additional_equipment || "",
      photos: JSON.parse(row.photos || "[]"),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const equipmentRepository = new EquipmentRepository();

module.exports = { equipmentRepository };
