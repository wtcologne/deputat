-- ============================================
-- Supabase Setup SQL Script
-- Kopiere diesen gesamten Inhalt in den Supabase SQL Editor
-- ============================================

-- 1. Tabelle: users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy für anonymen Zugriff (Lesen und Schreiben)
DROP POLICY IF EXISTS "Enable anonymous access for users" ON users;
CREATE POLICY "Enable anonymous access for users"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Tabelle: availability
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_iso TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('mon', 'tue', 'wed', 'thu', 'fri')),
  slot_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, week_start_iso, day, slot_id)
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_availability_week ON availability(week_start_iso);
CREATE INDEX IF NOT EXISTS idx_availability_user ON availability(user_id);

-- Row Level Security aktivieren
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy für anonymen Zugriff
DROP POLICY IF EXISTS "Enable anonymous access for availability" ON availability;
CREATE POLICY "Enable anonymous access for availability"
  ON availability
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Tabelle: assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_iso TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('mon', 'tue', 'wed', 'thu', 'fri')),
  slot_id TEXT NOT NULL,
  primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(week_start_iso, day, slot_id)
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_assignments_week ON assignments(week_start_iso);

-- Row Level Security aktivieren
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy für anonymen Zugriff
DROP POLICY IF EXISTS "Enable anonymous access for assignments" ON assignments;
CREATE POLICY "Enable anonymous access for assignments"
  ON assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Realtime für alle Tabellen aktivieren
-- Hinweis: Falls Tabellen bereits zur Publication gehören, wird ein Fehler angezeigt - das ist OK!
-- Du kannst diese Fehler ignorieren oder die Zeilen einzeln ausführen

DO $$
BEGIN
  -- Versuche users hinzuzufügen (ignoriere Fehler wenn bereits vorhanden)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42710' THEN
      RAISE NOTICE 'Tabelle users ist bereits in der Publication';
    ELSE
      RAISE;
    END IF;
  END;
  
  -- Versuche availability hinzuzufügen
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE availability;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42710' THEN
      RAISE NOTICE 'Tabelle availability ist bereits in der Publication';
    ELSE
      RAISE;
    END IF;
  END;
  
  -- Versuche assignments hinzuzufügen
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42710' THEN
      RAISE NOTICE 'Tabelle assignments ist bereits in der Publication';
    ELSE
      RAISE;
    END IF;
  END;
END $$;

-- 5. Initiale Benutzer (Optional - kannst du weglassen wenn du keine Starter-Daten willst)
-- INSERT INTO users (name, color) VALUES
--   ('Anna', '#EF4444'),
--   ('Lukas', '#10B981'),
--   ('Mia', '#3B82F6');

-- ============================================
-- Fertig! Alle Tabellen sind erstellt und konfiguriert.
-- ============================================

