-- Migration: Fix RLS for password_reset_codes table
-- Created: 2026-01-06
-- 
-- This table is ONLY accessed via API routes using the service role key.
-- We disable RLS to ensure the service role can access the data without issues.

-- First, drop any existing policies
DROP POLICY IF EXISTS "Service role full access" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow all for service role" ON password_reset_codes;

-- Disable RLS on this table since:
-- 1. It's only accessed via server-side API routes (not directly from client)
-- 2. The API uses service role key for all operations
-- 3. This avoids any potential RLS bypass issues
ALTER TABLE password_reset_codes DISABLE ROW LEVEL SECURITY;

-- Add index for faster lookups by email if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);

COMMENT ON TABLE password_reset_codes IS 'Stores temporary OTP codes for password reset. Only accessible via API with service role.';
