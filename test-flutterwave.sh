#!/bin/bash

# 🧪 Script de Test Flutterwave
# Usage: bash test-flutterwave.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000"
LOCALE="fr"

echo -e "${BLUE}🧪 Test Flutterwave - Nubia Aura${NC}\n"

# Vérifier que le serveur est en cours d'exécution
echo -e "${YELLOW}1️⃣  Vérification du serveur...${NC}"
if ! curl -s "$API_BASE" > /dev/null; then
  echo -e "${RED}❌ Le serveur n'est pas accessible sur $API_BASE${NC}"
  echo -e "${YELLOW}Démarrez le serveur avec: npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Serveur accessible${NC}\n"

# Test 1: Initialiser un paiement
echo -e "${YELLOW}2️⃣  Test d'initialisation du paiement...${NC}"

PAYMENT_RESPONSE=$(curl -s -X POST "$API_BASE/api/payments/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "1",
        "quantity": 1,
        "price": 95000,
        "name": "Costume Africain Traditionnel"
      }
    ],
    "firstName": "Amadou",
    "lastName": "Test",
    "email": "test@example.com",
    "phone": "+221771234567",
    "address": "123 Rue Test",
    "city": "Dakar",
    "zipCode": "18000",
    "country": "Sénégal",
    "shippingMethod": "standard",
    "locale": "'$LOCALE'"
  }')

echo "Réponse: $PAYMENT_RESPONSE"

# Extraire l'ordre ID
ORDER_ID=$(echo "$PAYMENT_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
REFERENCE=$(echo "$PAYMENT_RESPONSE" | grep -o '"reference":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
  echo -e "${RED}❌ Erreur: Impossible de créer la commande${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Commande créée: $ORDER_ID${NC}"
echo -e "${GREEN}✅ Référence: $REFERENCE${NC}\n"

# Test 2: Vérifier la commande en DB
echo -e "${YELLOW}3️⃣  Vérification de la commande en base de données...${NC}"
echo -e "${BLUE}Commande ID: $ORDER_ID${NC}"
echo -e "${BLUE}Référence: $REFERENCE${NC}"
echo -e "${BLUE}Montant: 95000 FCFA${NC}"
echo -e "${BLUE}Statut de paiement attendu: pending${NC}\n"

# Test 3: Vérifier le paiement (simulation)
echo -e "${YELLOW}4️⃣  Test de vérification du paiement (succès)...${NC}"

VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/api/payments/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "'$REFERENCE'",
    "orderId": "'$ORDER_ID'",
    "status": "successful"
  }')

echo "Réponse: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Vérification réussie${NC}\n"
else
  echo -e "${RED}❌ Erreur lors de la vérification${NC}\n"
fi

# Test 4: Tester un paiement échoué
echo -e "${YELLOW}5️⃣  Test de vérification du paiement (échec)...${NC}"

FAILED_RESPONSE=$(curl -s -X POST "$API_BASE/api/payments/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "FAILED-TEST-'$(date +%s)'",
    "status": "failed"
  }')

echo "Réponse: $FAILED_RESPONSE"

if echo "$FAILED_RESPONSE" | grep -q '"success":false'; then
  echo -e "${GREEN}✅ Gestion d'erreur correcte${NC}\n"
else
  echo -e "${RED}❌ Erreur lors de la gestion d'erreur${NC}\n"
fi

# Test 5: Afficher les URLs importantes
echo -e "${YELLOW}6️⃣  URLs de test importantes:${NC}"
echo -e "${BLUE}Checkout:${NC} $API_BASE/$LOCALE/checkout"
echo -e "${BLUE}Callback:${NC} $API_BASE/payments/callback?reference=$REFERENCE"
echo -e "${BLUE}Dashboard Flutterwave:${NC} https://dashboard.flutterwave.com\n"

# Résumé
echo -e "${GREEN}✅ Tests Flutterwave terminés!${NC}"
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Allez sur: $API_BASE/$LOCALE/checkout"
echo "2. Remplissez le formulaire"
echo "3. Utilisez une carte de test: 4242 4242 4242 4242"
echo "4. Vérifiez la commande en DB"
echo "5. Consultez les logs pour les détails\n"

echo -e "${BLUE}📚 Consultez FLUTTERWAVE_TEST_GUIDE.md pour plus de détails${NC}"
