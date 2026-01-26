#!/bin/bash

echo "🧪 Testing Charge Creation with ISO DateTime format..."
echo ""

curl -s -X POST http://localhost:5003/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "operationName": "CreateCharge",
    "variables": {
      "item": {
        "name": "Nettoyage mensuel",
        "description": "Frais de nettoyage des parties communes",
        "chargeType": "CLEANING",
        "frequency": "MONTHLY",
        "totalAmount": 250,
        "distributionMethod": "BY_SHARES",
        "startDate": "2026-01-14T00:00:00",
        "endDate": "2026-01-31T00:00:00",
        "isActive": true,
        "copropertyId": "613e7c2dfda845c491c0bbbdce351f77",
        "id": "00000000-0000-0000-0000-000000000000",
        "createdBy": "00000000-0000-0000-0000-000000000000"
      }
    },
    "query": "mutation CreateCharge($item: ChargeInput!) { createCharge(charge: $item) { id copropertyId name description chargeType frequency totalAmount distributionMethod startDate endDate isActive createdBy createdAt updatedAt }}"
  }' | jq .

echo ""
echo "✅ Test completed"
