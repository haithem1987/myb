#!/bin/bash

# ✅ CORRECT Payload for Charge Creation (with ISO DateTime format)
echo "🧪 Test 1: Create Charge with CORRECT DateTime Format"
echo "=================================================="

RESPONSE=$(curl -s -X POST http://localhost:8083/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "operationName": "CreateCharge",
    "variables": {
      "item": {
        "name": "Nettoyage Janvier",
        "description": "Nettoyage des parties communes",
        "chargeType": "CLEANING",
        "frequency": "MONTHLY",
        "totalAmount": 250.50,
        "distributionMethod": "BY_SHARES",
        "startDate": "2026-01-14T00:00:00",
        "endDate": "2026-01-31T00:00:00",
        "isActive": true,
        "copropertyId": "613e7c2dfda845c491c0bbbdce351f77",
        "id": "00000000-0000-0000-0000-000000000000",
        "createdBy": "00000000-0000-0000-0000-000000000000"
      }
    },
    "query": "mutation CreateCharge($item: ChargeInput!) { createCharge(charge: $item) { id name startDate endDate copropertyId } }"
  }')

echo "$RESPONSE" | jq .

# Extract success or error
if echo "$RESPONSE" | jq -e '.data.createCharge.id' > /dev/null 2>&1; then
  CHARGE_ID=$(echo "$RESPONSE" | jq -r '.data.createCharge.id')
  echo ""
  echo "✅ SUCCESS! Charge created with ID: $CHARGE_ID"
  echo ""
  
  # Test 2: Update the Charge
  echo "🧪 Test 2: Update Charge"
  echo "=================================================="
  
  UPDATE_RESPONSE=$(curl -s -X POST http://localhost:8083/graphql \
    -H "Content-Type: application/json" \
    -d "{
      \"operationName\": \"UpdateCharge\",
      \"variables\": {
        \"item\": {
          \"id\": \"$CHARGE_ID\",
          \"name\": \"Nettoyage Janvier (UPDATED)\",
          \"description\": \"Nettoyage des parties communes - Édition\",
          \"chargeType\": \"CLEANING\",
          \"frequency\": \"MONTHLY\",
          \"totalAmount\": 275.00,
          \"distributionMethod\": \"BY_SHARES\",
          \"startDate\": \"2026-01-15T00:00:00\",
          \"endDate\": \"2026-02-15T00:00:00\",
          \"isActive\": true,
          \"copropertyId\": \"613e7c2dfda845c491c0bbbdce351f77\",
          \"createdBy\": \"00000000-0000-0000-0000-000000000000\"
        }
      },
      \"query\": \"mutation UpdateCharge(\$item: ChargeInput!) { updateCharge(charge: \$item) { id name totalAmount } }\"
    }")
  
  echo "$UPDATE_RESPONSE" | jq .
  
  if echo "$UPDATE_RESPONSE" | jq -e '.data.updateCharge.id' > /dev/null 2>&1; then
    echo ""
    echo "✅ SUCCESS! Charge updated"
  else
    echo ""
    echo "❌ FAILED! Check error above"
    echo "$UPDATE_RESPONSE" | jq '.errors'
  fi
else
  echo ""
  echo "❌ FAILED! Check error:"
  echo "$RESPONSE" | jq '.errors'
fi

# Test 3: Create Maintenance Request
echo ""
echo "🧪 Test 3: Create Maintenance Request"
echo "=================================================="

MAINT_RESPONSE=$(curl -s -X POST http://localhost:8083/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "operationName": "CreateMaintenanceRequest",
    "variables": {
      "item": {
        "title": "Réparation ascenseur étage 3",
        "description": "L'\''ascenseur ne fonctionne pas correctement",
        "category": "ELECTRICAL",
        "priority": "HIGH",
        "status": "PENDING",
        "copropertyId": "613e7c2dfda845c491c0bbbdce351f77",
        "requestedBy": "user-123",
        "scheduledDate": "2026-01-25T00:00:00",
        "id": "00000000-0000-0000-0000-000000000000"
      }
    },
    "query": "mutation CreateMaintenanceRequest($item: MaintenanceRequestInput!) { createMaintenanceRequest(request: $item) { id title priority status scheduledDate } }"
  }')

echo "$MAINT_RESPONSE" | jq .

if echo "$MAINT_RESPONSE" | jq -e '.data.createMaintenanceRequest.id' > /dev/null 2>&1; then
  echo ""
  echo "✅ SUCCESS! Maintenance request created"
else
  echo ""
  echo "❌ FAILED! Check error:"
  echo "$MAINT_RESPONSE" | jq '.errors'
fi
