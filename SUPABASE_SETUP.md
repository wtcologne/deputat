# Supabase Setup Anleitung

## 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Notiere dir die **Project URL** und **anon public key** aus den Project Settings > API

## 2. Environment Variables

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
NEXT_PUBLIC_SUPABASE_URL=deine-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

## 3. Datenbank-Schema erstellen

Gehe im Supabase Dashboard zu **SQL Editor** und führe folgende SQL-Befehle aus:

### Tabelle: users

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy für anonymen Zugriff (Lesen und Schreiben)
CREATE POLICY "Enable anonymous access for users"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Tabelle: availability

```sql
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_iso TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('mon', 'tue', 'wed', 'thu', 'fri')),
  slot_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, week_start_iso, day, slot_id)
);

-- Index für bessere Performance
CREATE INDEX idx_availability_week ON availability(week_start_iso);
CREATE INDEX idx_availability_user ON availability(user_id);

-- Row Level Security aktivieren
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy für anonymen Zugriff
CREATE POLICY "Enable anonymous access for availability"
  ON availability
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Tabelle: assignments

```sql
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_iso TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('mon', 'tue', 'wed', 'thu', 'fri')),
  slot_id TEXT NOT NULL,
  primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(week_start_iso, day, slot_id)
);

-- Index für bessere Performance
CREATE INDEX idx_assignments_week ON assignments(week_start_iso);

-- Row Level Security aktivieren
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy für anonymen Zugriff
CREATE POLICY "Enable anonymous access for assignments"
  ON assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 4. Realtime aktivieren

Für Realtime-Updates müssen die Tabellen zur `supabase_realtime` Publication hinzugefügt werden.

Im Supabase Dashboard:
1. Gehe zu **SQL Editor**
2. Führe folgenden SQL-Befehl aus:

```sql
-- Realtime für alle Tabellen aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE availability;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
```

**Alternative:** Falls du die UI-Variante findest:
1. Gehe zu **Database** > **Replication** (oder **Realtime**)
2. Aktiviere Realtime für die Tabellen:
   - `users`
   - `availability`
   - `assignments`

## 5. Initiale Daten (Optional)

Falls du initiale Benutzer in der Datenbank haben möchtest:

```sql
INSERT INTO users (name, color) VALUES
  ('Anna', '#EF4444'),
  ('Lukas', '#10B981'),
  ('Mia', '#3B82F6');
```

## 6. Testen

1. Starte die Next.js App: `npm run dev`
2. Die App sollte sich automatisch mit Supabase verbinden
3. Alle Änderungen werden jetzt in der Datenbank gespeichert und sind für alle Benutzer sichtbar

## Wichtig

- Die RLS Policies erlauben **anonymen Zugriff** - jeder kann lesen und schreiben
- Für Produktion solltest du eine Authentifizierung hinzufügen
- Die Supabase Free Tier ist ausreichend für kleine Teams

