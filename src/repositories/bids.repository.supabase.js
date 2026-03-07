const { getSupabaseClient } = require("../db/supabase");

class BidsRepository {
  async create(bid) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("bids")
      .insert({
        id: bid.id,
        order_id: bid.orderId,
        contractor_id: bid.contractorId,
        price: bid.price,
        delivery_price: bid.deliveryPrice || 0,
        payment_type: bid.paymentType,
        comment: bid.comment,
        equipment_id: bid.equipmentId,
        equipment_name: bid.equipmentName,
        equipment_category: bid.equipmentCategory,
        created_at: bid.createdAt,
        updated_at: bid.updatedAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bid: ${error.message}`);
    }

    return this.#mapRow(data);
  }

  async findByOrderId(orderId) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch bids by order: ${error.message}`);
    }

    return data.map((row) => this.#mapRow(row));
  }

  async findOrderIdsByContractorId(contractorId) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("bids")
      .select("order_id")
      .eq("contractor_id", contractorId);

    if (error) {
      throw new Error(`Failed to fetch order IDs by contractor: ${error.message}`);
    }

    return [...new Set(data.map((r) => r.order_id))];
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
