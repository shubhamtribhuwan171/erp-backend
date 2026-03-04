#!/bin/bash
echo "=========================================="
echo "🧪 Complete API Test Suite"
echo "=========================================="

BASE="http://localhost:3000/api"

# Login first
echo "📋 Logging in..."
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"test@erp.com","password":"testpass123"}')
TOKEN=$(echo $LOGIN | grep -o '"access_token":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Token: ${TOKEN:0:30}..."

test_endpoint() {
  METHOD=$1
  ENDPOINT=$2
  PAYLOAD=$3
  NAME=$4
  
  if [ "$METHOD" = "GET" ]; then
    RESP=$(curl -s -X GET "$BASE$ENDPOINT" -H "Authorization: Bearer $TOKEN")
  else
    RESP=$(curl -s -X $METHOD "$BASE$ENDPOINT" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$PAYLOAD")
  fi
  
  if echo $RESP | grep -q '"success":true'; then
    echo "✅ $NAME"
  else
    echo "❌ $NAME"
  fi
}

echo ""
echo "Testing all endpoints..."

# Settings
test_endpoint "GET" "/settings/company" "" "Get Company"
test_endpoint "GET" "/settings/users" "" "List Users"
test_endpoint "GET" "/auth/me" "" "Get Me"

# Inventory
test_endpoint "GET" "/inventory/items" "" "List Items"
test_endpoint "GET" "/inventory/categories" "" "List Categories"
test_endpoint "GET" "/inventory/units" "" "List Units"
test_endpoint "GET" "/inventory/warehouses" "" "List Warehouses"

# Sales
test_endpoint "GET" "/sales/orders" "" "List Sales Orders"
test_endpoint "GET" "/sales/quotations" "" "List Quotations"
test_endpoint "GET" "/sales/invoices" "" "List Invoices"

# Purchases
test_endpoint "GET" "/purchases/orders" "" "List Purchase Orders"
test_endpoint "GET" "/purchases/receipts" "" "List Receipts"

# Accounting
test_endpoint "GET" "/accounting/accounts" "" "List Accounts"
test_endpoint "GET" "/accounting/journal" "" "List Journal"

# HR
test_endpoint "GET" "/hr/employees" "" "List Employees"
test_endpoint "GET" "/hr/departments" "" "List Departments"

# CRM
test_endpoint "GET" "/crm/leads" "" "List Leads"
test_endpoint "GET" "/crm/contacts" "" "List Contacts"

echo ""
echo "=========================================="
echo "✅ API Test Complete!"
echo "=========================================="
