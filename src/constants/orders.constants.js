const EQUIPMENT_CATEGORY_MAP = {
  dump_truck: "dump_truck",
  самосвал: "dump_truck",
  excavator: "excavator",
  экскаватор: "excavator",
  loader: "loader",
  погрузчик: "loader",
  bulldozer: "bulldozer",
  бульдозер: "bulldozer",
  crane: "crane",
  кран: "crane",
  grader: "grader",
  грейдер: "grader",
  compactor: "compactor",
  каток: "compactor",
  other: "other",
  другое: "other"
};

const PRICING_UNIT_MAP = {
  per_hour: "per_hour",
  "за час": "per_hour",
  per_shift: "per_shift",
  "за смену": "per_shift",
  per_m3: "per_m3",
  "за м3": "per_m3",
  "за м^3": "per_m3",
  per_ton: "per_ton",
  "за тонну": "per_ton",
  per_ton_km: "per_ton_km",
  "за т*км": "per_ton_km",
  "за т-км": "per_ton_km",
  per_m3_km: "per_m3_km",
  "за м3*км": "per_m3_km",
  "за м3-км": "per_m3_km",
  per_m2: "per_m2",
  "за м2": "per_m2",
  per_linear_m: "per_linear_m",
  "за погонный метр": "per_linear_m"
};

const PAYMENT_TYPE_MAP = {
  cash: "cash",
  наличные: "cash",
  nds: "nds",
  "с ндс": "nds",
  usn: "usn",
  усн: "usn"
};

module.exports = {
  EQUIPMENT_CATEGORY_MAP,
  PRICING_UNIT_MAP,
  PAYMENT_TYPE_MAP
};
