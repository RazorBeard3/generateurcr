-- Migration 001 — Ajout de user_id aux tables crs et projects
-- À coller dans Supabase → SQL Editor → New query
-- Exécuter AVANT migration_002_rls.sql

-- ─────────────────────────────────────────────
-- Étape 1 : ajouter la colonne user_id (nullable d'abord)
-- ─────────────────────────────────────────────
ALTER TABLE crs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────
-- Étape 2 : supprimer les lignes sans utilisateur
--
-- ATTENTION : ces lignes suppriment les données existantes
-- qui n'ont pas de user_id (données de test, démo, etc.)
--
-- Si vous avez des données à conserver, commentez ces deux
-- lignes DELETE et traitez manuellement avant de continuer.
-- ─────────────────────────────────────────────
DELETE FROM crs      WHERE user_id IS NULL;
DELETE FROM projects WHERE user_id IS NULL;

-- ─────────────────────────────────────────────
-- Étape 3 : rendre user_id obligatoire
-- ─────────────────────────────────────────────
ALTER TABLE crs      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;

-- ─────────────────────────────────────────────
-- Étape 4 : supprimer les colonnes obsolètes
-- (transcription et audioPath ne sont plus stockés depuis Phase 2)
-- ─────────────────────────────────────────────
ALTER TABLE crs DROP COLUMN IF EXISTS transcription;
ALTER TABLE crs DROP COLUMN IF EXISTS "audioPath";
