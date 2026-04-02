-- ========================================
-- SQL Setup for Percetakan Management System
-- Run this in: Supabase Dashboard > SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- 2. Papers
CREATE TABLE IF NOT EXISTS "Paper" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "grammage" INTEGER NOT NULL,
  "width" DOUBLE PRECISION NOT NULL,
  "height" DOUBLE PRECISION NOT NULL,
  "price_per_rim" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- 3. Printing Costs
CREATE TABLE IF NOT EXISTS "PrintingCost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "machine_name" TEXT NOT NULL,
  "grammage" INTEGER NOT NULL,
  "print_area_width" DOUBLE PRECISION NOT NULL,
  "print_area_height" DOUBLE PRECISION NOT NULL,
  "price_per_color" DOUBLE PRECISION NOT NULL,
  "special_color_price" DOUBLE PRECISION NOT NULL,
  "minimum_print_quantity" INTEGER NOT NULL,
  "price_above_minimum_per_sheet" DOUBLE PRECISION NOT NULL,
  "plate_price_per_sheet" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- 4. Finishings
CREATE TABLE IF NOT EXISTS "Finishing" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "minimum_sheets" INTEGER NOT NULL,
  "minimum_price" DOUBLE PRECISION NOT NULL,
  "additional_price" DOUBLE PRECISION NOT NULL,
  "price_per_cm" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- 5. Settings
CREATE TABLE IF NOT EXISTS "Setting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- 6. Riwayat Potong Kertas
CREATE TABLE IF NOT EXISTS "RiwayatPotongKertas" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customer_name" TEXT NOT NULL,
  "paper_name" TEXT NOT NULL,
  "grammage" INTEGER DEFAULT 0,
  "paper_width" DOUBLE PRECISION NOT NULL,
  "paper_height" DOUBLE PRECISION NOT NULL,
  "cut_width" DOUBLE PRECISION NOT NULL,
  "cut_height" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "total_pieces" INTEGER NOT NULL,
  "sheets_needed" INTEGER NOT NULL,
  "price_per_sheet" DOUBLE PRECISION DEFAULT 0,
  "total_price" DOUBLE PRECISION NOT NULL,
  "strategy" TEXT NOT NULL,
  "scenario_type" TEXT DEFAULT '',
  "total_waste_area" DOUBLE PRECISION DEFAULT 0,
  "steps" TEXT DEFAULT '',
  "efficiency" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- 7. Riwayat Hitung Cetakan
CREATE TABLE IF NOT EXISTS "RiwayatHitungCetakan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "print_name" TEXT NOT NULL,
  "paper_name" TEXT NOT NULL,
  "paper_grammage" TEXT DEFAULT '0',
  "paper_length" TEXT NOT NULL,
  "paper_width" TEXT NOT NULL,
  "cut_width" TEXT NOT NULL,
  "cut_height" TEXT NOT NULL,
  "quantity" TEXT NOT NULL,
  "warna" TEXT NOT NULL,
  "warna_khusus" TEXT NOT NULL,
  "machine_name" TEXT NOT NULL,
  "harga_plat" DOUBLE PRECISION DEFAULT 0,
  "ongkos_cetak" DOUBLE PRECISION NOT NULL,
  "ongkos_cetak_detail" TEXT DEFAULT '',
  "total_paper_price" DOUBLE PRECISION NOT NULL,
  "finishing_names" TEXT NOT NULL,
  "finishing_breakdown" TEXT DEFAULT '',
  "finishing_cost" DOUBLE PRECISION NOT NULL,
  "packing_cost" DOUBLE PRECISION NOT NULL,
  "shipping_cost" DOUBLE PRECISION NOT NULL,
  "sub_total" DOUBLE PRECISION NOT NULL,
  "profit_percent" DOUBLE PRECISION NOT NULL,
  "profit_amount" DOUBLE PRECISION NOT NULL,
  "grand_total" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security and make tables accessible
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Paper" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrintingCost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finishing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiwayatPotongKertas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiwayatHitungCetakan" ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for all tables (service_role bypasses RLS anyway)
CREATE POLICY "Allow all on Customer" ON "Customer" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Paper" ON "Paper" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on PrintingCost" ON "PrintingCost" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Finishing" ON "Finishing" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Setting" ON "Setting" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on RiwayatPotongKertas" ON "RiwayatPotongKertas" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on RiwayatHitungCetakan" ON "RiwayatHitungCetakan" FOR ALL USING (true) WITH CHECK (true);

-- Insert default profit setting
INSERT INTO "Setting" ("key", "value") VALUES ('profit', '10')
ON CONFLICT ("key") DO NOTHING;

-- Done!
SELECT 'All tables created successfully!' as status;
