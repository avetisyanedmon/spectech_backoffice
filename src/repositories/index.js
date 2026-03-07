const USE_SUPABASE = process.env.USE_SUPABASE === "true";

let ordersRepository;
let equipmentRepository;
let bidsRepository;

if (USE_SUPABASE) {
  ordersRepository = require("./orders.repository.supabase").ordersRepository;
  equipmentRepository = require("./equipment.repository.supabase").equipmentRepository;
  bidsRepository = require("./bids.repository.supabase").bidsRepository;
  console.log("✓ Using Supabase (PostgreSQL) repositories");
} else {
  ordersRepository = require("./orders.repository").ordersRepository;
  equipmentRepository = require("./equipment.repository").equipmentRepository;
  bidsRepository = require("./bids.repository").bidsRepository;
  console.log("✓ Using SQLite repositories");
}

module.exports = {
  ordersRepository,
  equipmentRepository,
  bidsRepository,
};
