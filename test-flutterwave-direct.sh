#!/bin/bash

# 🧪 Test Direct Flutterwave API
# Teste directement l'API Flutterwave sans passer par votre backend
# Usage: bash test-flutterwave-direct.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
API_KEY="MHsoXDxiOHs1bNGf1zQfd8bBB87i7prG"
API_BASE="https://api.flutterwave.com/v3"
REDIRECT_URL="http://localhost:3000/payments/callback"

echo -e "${CYAN}🧪 TEST DIRECT FLUTTERWAVE API${NC}\n"

# Test 1: Vérifier la clé API
echo -e "${BLUE}1️⃣  Vérification de la clé API${NC}"
echo "Clé: ${API_KEY:0:10}...${API_KEY: -5}"
echo "Longueur: ${#API_KEY}"
echo ""

# Test 2: Initialiser un paiement
echo -e "${BLUE}2️⃣  Initialiser un paiement${NC}"

PAYMENT_RESPONSE=$(curl -s -X POST "$API_BASE/payments" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tx_ref": "ORD-'$(date +%s)'",
    "amount": 95000,
    "currency": "XOF",
    "redirect_url": "'$REDIRECT_URL'",
    "customer": {
      "email": "test@example.com",
      "phone_number": "+221771234567",
      "name": "Amadou Test"
    },
    "customizations": {
      "title": "Nubia Aura",
      "description": "Test Payment",
      "logo": "https://nubiaaura.com/logo.png"
    }
  }')

echo "Réponse:"
echo "$PAYMENT_RESPONSE" | jq '.' 2>/dev/null || echo "$PAYMENT_RESPONSE"
echo ""

# Extraire le lien de paiement
PAYMENT_LINK=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.link' 2>/dev/null || echo "")
REFERENCE=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.reference' 2>/dev/null || echo "")
TX_REF=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.tx_ref' 2>/dev/null || echo "")

if [ -n "$PAYMENT_LINK" ] && [ "$PAYMENT_LINK" != "null" ]; then
  echo -e "${GREEN}✅ Paiement initialisé avec succès!${NC}"
  echo "Lien de paiement: $PAYMENT_LINK"
  echo "Référence: $REFERENCE"
  echo "TX Ref: $TX_REF"
else
  echo -e "${RED}❌ Erreur lors de l'initialisation du paiement${NC}"
  echo "Vérifiez:"
  echo "  - La clé API est correcte"
  echo "  - La clé est pour le sandbox (TEST)"
  echo "  - Le montant est valide (> 100 XOF)"
  exit 1
fi

echo ""

# Test 3: Vérifier un paiement (simulation)
if [ -n "$REFERENCE" ] && [ "$REFERENCE" != "null" ]; then
  echo -e "${BLUE}3️⃣  Vérifier le paiement${NC}"
  
  VERIFY_RESPONSE=$(curl -s -X GET "$API_BASE/transactions/$REFERENCE/verify" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json")
  
  echo "Réponse:"
  echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
  echo ""
fi

# Test 4: Lister les transactions
echo -e "${BLUE}4️⃣  Lister les transactions récentes${NC}"

TRANSACTIONS=$(curl -s -X GET "$API_BASE/transactions?limit=5" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json")

echo "Réponse:"
echo "$TRANSACTIONS" | jq '.data[] | {id, tx_ref, amount, status, created_at}' 2>/dev/null || echo "$TRANSACTIONS"
echo ""

# Résumé
echo -e "${CYAN}📊 RÉSUMÉ${NC}"
echo "✅ Clé API: Valide"
echo "✅ Paiement initialisé: $PAYMENT_LINK"
echo "✅ Référence: $REFERENCE"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Allez sur: $PAYMENT_LINK"
echo "2. Utilisez une carte de test: 4242 4242 4242 4242"
echo "3. Expiration: 09/32, CVV: 812"
echo "4. Complétez le paiement"
echo "5. Vous serez redirigé vers: $REDIRECT_URL"
echo ""
echo -e "${GREEN}✅ Test Direct Flutterwave Terminé!${NC}"
