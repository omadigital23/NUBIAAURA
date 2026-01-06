-- Migration: Create password_reset_codes table for OTP-based password reset
-- Created: 2026-01-06

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no direct client access)
-- This ensures codes can only be verified through our API

-- Auto-cleanup expired codes (optional: run periodically)
-- DELETE FROM password_reset_codes WHERE expires_at < NOW();

COMMENT ON TABLE password_reset_codes IS 'Stores temporary OTP codes for password reset verification';
