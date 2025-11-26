-- Migration: Add password_hash column to users table
-- Created: 2024-11-26

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;

