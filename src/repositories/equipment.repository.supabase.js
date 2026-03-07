const { getSupabaseClient } = require("../db/supabase");

class EquipmentRepository {
  async create(item) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("equipment")
      .insert({
        id: item.id,
        owner_id: item.ownerId,
        name: item.name,
        category: item.category,
        characteristics: item.characteristics,
        additional_equipment: item.additionalEquipment,
        photos: item.photos || [],
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create equipment: ${error.message}`);
    }

    return this.#mapRow(data);
  }

  async findByOwnerId(ownerId) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch equipment by owner: ${error.message}`);
    }

    return data.map((row) => this.#mapRow(row));
  }

  async reset() {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.from("equipment").delete().neq("id", "");

    if (error) {
      throw new Error(`Failed to reset equipment: ${error.message}`);
    }
  }

  #mapRow(row) {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      category: row.category,
      characteristics: row.characteristics,
      additionalEquipment: row.additional_equipment || "",
      photos: Array.isArray(row.photos) ? row.photos : JSON.parse(row.photos || "[]"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

const equipmentRepository = new EquipmentRepository();

module.exports = { equipmentRepository };
