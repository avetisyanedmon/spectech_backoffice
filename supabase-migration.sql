-- Supabase Migration Script for SpecTech Backoffice
-- Run this script in your Supabase SQL Editor to create the database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id TEXT NOT NULL,
  equipment_category TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  payment_types TEXT NOT NULL,
  pricing_unit TEXT NOT NULL,
  work_volume REAL NOT NULL,
  start_date_time TIMESTAMPTZ NOT NULL,
  duration_hours INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  bid_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on orders
CREATE INDEX IF NOT EXISTS idx_orders_creator_created_at
  ON orders (creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_expires_at
  ON orders (expires_at);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  characteristics JSONB NOT NULL,
  additional_equipment TEXT,
  photos JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on equipment
CREATE INDEX IF NOT EXISTS idx_equipment_owner_created_at
  ON equipment (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_equipment_category
  ON equipment (category);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  contractor_id TEXT NOT NULL,
  price REAL NOT NULL,
  delivery_price REAL NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL,
  comment TEXT,
  equipment_id UUID,
  equipment_name TEXT,
  equipment_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_bids_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
);

-- Create indexes on bids
CREATE INDEX IF NOT EXISTS idx_bids_order_id
  ON bids (order_id);

CREATE INDEX IF NOT EXISTS idx_bids_contractor_id
  ON bids (contractor_id);

CREATE INDEX IF NOT EXISTS idx_bids_equipment_id
  ON bids (equipment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update bid_count when bids are inserted/deleted
CREATE OR REPLACE FUNCTION update_order_bid_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE orders SET bid_count = bid_count + 1 WHERE id = NEW.order_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE orders SET bid_count = bid_count - 1 WHERE id = OLD.order_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update bid_count
CREATE TRIGGER update_order_bid_count_trigger
  AFTER INSERT OR DELETE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_order_bid_count();

-- Enable Row Level Security (RLS) - Optional, configure based on your auth strategy
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE orders IS 'Customer orders for equipment rental';
COMMENT ON TABLE equipment IS 'Contractor equipment listings';
COMMENT ON TABLE bids IS 'Contractor bids on customer orders';
