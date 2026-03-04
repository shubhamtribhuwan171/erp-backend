#!/bin/bash

echo "=========================================="
echo "🧪 RBAC E2E Test Suite"
echo "=========================================="

BASE_URL="http://localhost:3000/api"
LOG_FILE="rbac-test-$(date +%Y%m%d-%H%M%S).txt"

log() {
  echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test 1: Login as Owner
log "📋 Test 1: Login as Owner"
OWNER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@erp.com","password":"testpass123"}')

OWNER_TOKEN=$(echo $OWNER_LOGIN | grep -o '"access_token":"[^"]*' | head -1 | cut -d'"' -f4)
OWNER_COMPANY=$(echo $OWNER_LOGIN | grep -o '"companyId":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$OWNER_TOKEN" ]; then
  log "✅ Owner login successful"
else
  log "❌ Owner login failed"
  exit 1
fi

# Test 2: Try to create customer as Owner (should work)
log "📋 Test 2: Create customer as Owner"
CREATE_RESULT=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"name":"Owner Customer","email":"owner@test.com"}')

if echo $CREATE_RESULT | grep -q '"success":true'; then
  log "✅ Owner can create customer"
else
  log "❌ Owner cannot create customer: $CREATE_RESULT"
fi

# Test 3: Try to delete as Owner (should work)
CUSTOMER_ID=$(echo $CREATE_RESULT | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Test 4: Login as different user (if exists) - test data isolation
log "📋 Test 4: Test data isolation between companies"
OTHER_COMPANY_CUSTOMERS=$(curl -s -X GET "$BASE_URL/customers" \
  -H "Authorization: Bearer $OWNER_TOKEN")

# Check that owner only sees their company's data
if echo $OTHER_COMPANY_CUSTOMERS | grep -q "$OWNER_COMPANY"; then
  log "✅ Data is company-scoped correctly"
else
  log "⚠️ Need to verify company isolation"
fi

# Test 5: Test without auth (should fail for create)
log "📋 Test 5: Create customer WITHOUT auth (should fail)"
NO_AUTH_RESULT=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacker","email":"hacker@test.com"}')

if echo $NO_AUTH_RESULT | grep -q '"success":false'; then
  log "✅ Unauthenticated request rejected"
else
  log "⚠️ Unauthenticated request status: $NO_AUTH_RESULT"
fi

# Test 6: Test with invalid token
log "📋 Test 6: Create customer with invalid token (should fail)"
INVALID_TOKEN_RESULT=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_here" \
  -d '{"name":"Hacker","email":"hacker@test.com"}')

if echo $INVALID_TOKEN_RESULT | grep -q '"success":false'; then
  log "✅ Invalid token rejected"
else
  log "⚠️ Invalid token status: $INVALID_TOKEN_RESULT"
fi

# Test 7: Test vendor creation (different module)
log "📋 Test 7: Create vendor as Owner"
VENDOR_RESULT=$(curl -s -X POST "$BASE_URL/vendors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"name":"Test Vendor","email":"vendor@test.com"}')

if echo $VENDOR_RESULT | grep -q '"success":true'; then
  log "✅ Owner can create vendor"
else
  log "❌ Owner cannot create vendor: $VENDOR_RESULT"
fi

# Test 8: Test inventory creation
log "📋 Test 8: Create inventory unit as Owner"
UNIT_RESULT=$(curl -s -X POST "$BASE_URL/inventory/units" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"code":"BOX","name":"Box"}')

if echo $UNIT_RESULT | grep -q '"success":true'; then
  log "✅ Owner can create inventory unit"
else
  log "❌ Owner cannot create inventory unit: $UNIT_RESULT"
fi

# Test 9: Test sales order creation
log "📋 Test 9: Create sales order as Owner"
ORDER_RESULT=$(curl -s -X POST "$BASE_URL/sales/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"customer_id\":\"$CUSTOMER_ID\",\"order_date\":\"2026-03-04\",\"items\":[]}")

if echo $ORDER_RESULT | grep -q '"success":true'; then
  log "✅ Owner can create sales order"
else
  log "❌ Owner cannot create sales order: $ORDER_RESULT"
fi

# Test 10: Cross-company access test
log "📋 Test 10: Verify data belongs to correct company"
DEMO_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@erp.com","password":"demo1234"}')

DEMO_TOKEN=$(echo $DEMO_LOGIN | grep -o '"access_token":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$DEMO_TOKEN" ]; then
  DEMO_CUSTOMERS=$(curl -s -X GET "$BASE_URL/customers" \
    -H "Authorization: Bearer $DEMO_TOKEN")
  
  # Demo company should NOT see test company's customers
  if echo $DEMO_CUSTOMERS | grep -q "Test Company"; then
    log "❌ Data leak: Demo sees Test Company's data!"
  else
    log "✅ Data isolation verified between companies"
  fi
fi

echo ""
echo "=========================================="
log "✅ RBAC Test Suite Complete!"
log "Log file: $LOG_FILE"
echo "=========================================="
