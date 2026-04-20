-- Migration 002 — Politiques RLS strictes par utilisateur
-- À coller dans Supabase → SQL Editor → New query
-- Exécuter APRÈS migration_001_user_id.sql

-- ─────────────────────────────────────────────
-- Supprimer les anciennes policies ouvertes
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Accès public projects" ON projects;
DROP POLICY IF EXISTS "Accès public crs"      ON crs;

-- ─────────────────────────────────────────────
-- Policies strictes pour la table crs
-- Chaque utilisateur ne voit et ne touche que ses propres CRs
-- ─────────────────────────────────────────────
CREATE POLICY "crs_select" ON crs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "crs_insert" ON crs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "crs_update" ON crs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "crs_delete" ON crs
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Policies strictes pour la table projects
-- ─────────────────────────────────────────────
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (auth.uid() = user_id);
