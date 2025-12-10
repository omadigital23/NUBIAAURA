-- Table pour stocker les tokens de validation (fallback si pas Redis)
CREATE TABLE IF NOT EXISTS order_validation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(order_id, token)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_order_validation_tokens_order_id ON order_validation_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_order_validation_tokens_expires_at ON order_validation_tokens(expires_at);

-- RLS : Pas d'accès public (seulement via service role)
ALTER TABLE order_validation_tokens ENABLE ROW LEVEL SECURITY;

-- Fonction de nettoyage automatique des tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_validation_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM order_validation_tokens
  WHERE expires_at < NOW()
  OR used_at IS NOT NULL AND used_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE order_validation_tokens IS 'Tokens de validation pour les liens WhatsApp (fallback si pas Redis)';
COMMENT ON COLUMN order_validation_tokens.order_id IS 'Numéro de commande (ORD-xxx)';
COMMENT ON COLUMN order_validation_tokens.token IS 'Token de validation SHA256 (32 caractères)';
COMMENT ON COLUMN order_validation_tokens.expires_at IS 'Date d''expiration du token (24h après création)';
COMMENT ON COLUMN order_validation_tokens.used_at IS 'Date d''utilisation du token (NULL si pas encore utilisé)';
