-- ============================================
-- UPDATE: Demo Mode, Auto Logout, Change Password
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom is_demo di tabel Pengguna
ALTER TABLE "Pengguna" ADD COLUMN IF NOT EXISTS "is_demo" BOOLEAN DEFAULT true;

-- 2. Tambah kolom demo_until di tabel Pengguna (tanggal berakhir demo)
ALTER TABLE "Pengguna" ADD COLUMN IF NOT EXISTS "demo_until" TIMESTAMPTZ;

-- 3. Update semua user lama jadi bukan demo (admin tetap bukan demo)
UPDATE "Pengguna" SET "is_demo" = false WHERE "username" = 'admin';

-- 4. Insert default settings
INSERT INTO "Setting" ("key", "value") VALUES ('demo_days', '7') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "Setting" ("key", "value") VALUES ('popup_message', 'Selamat datang di demo Sistem Percetakan! Anda memiliki akses penuh selama masa demo. Untuk akun penuh, hubungi admin.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "Setting" ("key", "value") VALUES ('auto_logout_minutes', '30') ON CONFLICT ("key") DO NOTHING;

-- 5. Enable RLS policies
ALTER TABLE "Pengguna" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on Pengguna" ON "Pengguna"
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on Setting" ON "Setting"
  FOR ALL USING (true) WITH CHECK (true);
