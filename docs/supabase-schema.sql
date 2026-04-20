-- Schéma de référence — état final après migrations
-- Ne pas exécuter directement si la base existe déjà.
-- Utiliser migration_001_user_id.sql puis migration_002_rls.sql à la place.

CREATE TABLE IF NOT EXISTS projects (
  id          text      PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     uuid      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text      NOT NULL,
  color       text,
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crs (
  id            text      PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       uuid      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text,
  content       text,
  "projectId"   text      REFERENCES projects(id) ON DELETE SET NULL,
  "projectName" text,
  "projectColor" text,
  "meetingType" text,
  config        jsonb,
  duration      text,
  "createdAt"   timestamptz DEFAULT now(),
  "updatedAt"   timestamptz
);

-- RLS activé sur les deux tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crs      ENABLE ROW LEVEL SECURITY;

-- Policies projects — chaque utilisateur accède uniquement à ses données
CREATE POLICY "projects_select" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Policies crs
CREATE POLICY "crs_select" ON crs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "crs_insert" ON crs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "crs_update" ON crs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "crs_delete" ON crs FOR DELETE USING (auth.uid() = user_id);
