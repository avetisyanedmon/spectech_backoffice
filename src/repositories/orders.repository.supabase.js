const { getSupabaseClient } = require("../db/supabase");

class OrdersRepository {
  async create(order) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id: order.id,
        creator_id: order.creatorId,
        equipment_category: order.equipmentCategory,
        city: order.city,
        address: order.address,
        payment_types: JSON.stringify(order.paymentTypes),
        pricing_unit: order.pricingUnit,
        work_volume: order.workVolume,
        start_date_time: order.startDateTime,
        duration_hours: order.durationHours,
        expires_at: order.expiresAt,
        description: order.description,
        status: order.status,
        bid_count: order.bidCount || 0,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return this.#mapRow(data);
  }

  async findAll() {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data.map((row) => this.#mapRow(row));
  }

  async findById(id) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return this.#mapRow(data);
  }

  async findByCreatorId(creatorId) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders by creator: ${error.message}`);
    }

    return data.map((row) => this.#mapRow(row));
  }

  async incrementBidCount(id) {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.rpc("increment_bid_count", {
      order_id: id,
    });

    if (error) {
      const { data: order } = await supabase
        .from("orders")
        .select("bid_count")
        .eq("id", id)
        .single();

      if (order) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            bid_count: (order.bid_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (updateError) {
          throw new Error(`Failed to increment bid count: ${updateError.message}`);
        }
      }
    }
  }

  async reset() {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.from("orders").delete().neq("id", "");

    if (error) {
      throw new Error(`Failed to reset orders: ${error.message}`);
    }
  }

  #mapRow(row) {
    return {
      id: row.id,
      creatorId: row.creator_id,
      equipmentCategory: row.equipment_category,
      city: row.city,
      address: row.address,
      paymentTypes: typeof row.payment_types === "string" 
        ? JSON.parse(row.payment_types || "[]")
        : row.payment_types || [],
      pricingUnit: row.pricing_unit,
      workVolume: row.work_volume,
      startDateTime: row.start_date_time,
      durationHours: row.duration_hours,
      expiresAt: row.expires_at,
      description: row.description,
      status: row.status,
      bidCount: row.bid_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

const ordersRepository = new OrdersRepository();

module.exports = { ordersRepository };
