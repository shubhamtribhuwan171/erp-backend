#!/bin/bash

LOG_FILE="test-results-$(date +%Y%m%d-%H%M%S).txt"
API_URL="http://localhost:3000/api"

log() {
  echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_request() {
  echo "" | tee -a "$LOG_FILE"
  echo "==============================================" | tee -a "$LOG_FILE"
  echo "📡 $1 $2" | tee -a "$LOG_FILE"
  echo "Payload: $3" | tee -a "$LOG_FILE"
}

log_response() {
  echo "Response: $1" | tee -a "$LOG_FILE"
  echo "==============================================" | tee -a "$LOG_FILE"
}

echo "E2E Test Started at $(date)" > "$LOG_FILE"
echo "API URL: $API_URL" >> "$LOG_FILE"

TOKEN=""

# Test 1: Register
log_request "POST" "/auth/register" '{"email":"test@erp.com","password":"testpass123","companyName":"Test Company","fullName":"Test User"}'
REGISTER_RESP=$(curl -s -X POST "$API_URL/auth/register" -H "Content-Type: application/json" -d '{"email":"test@erp.com","password":"testpass123","companyName":"Test Company","fullName":"Test User"}')
log_response "$REGISTER_RESP"

# Test 2: Login
log_request "POST" "/auth/login" '{"email":"test@erp.com","password":"testpass123"}'
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"test@erp.com","password":"testpass123"}')
log_response "$LOGIN_RESP"
TOKEN=$(echo $LOGIN_RESP | grep -o '"access_token":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  log "❌ Login failed"
  exit 1
fi
log "✅ Got token: ${TOKEN:0:20}..."

# Test 3: Create Customer
log_request "POST" "/customers" '{"name":"John Doe","email":"john@example.com"}'
CUST_RESP=$(curl -s -X POST "$API_URL/customers" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"John Doe","email":"john@example.com","phone":"+91-9876543210","payment_terms_days":30}')
log_response "$CUST_RESP"
CUSTOMER_ID=$(echo $CUST_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Customer ID: $CUSTOMER_ID"

# Test 4: List Customers
log_request "GET" "/customers" ""
LIST_CUST_RESP=$(curl -s -X GET "$API_URL/customers?limit=10" -H "Authorization: Bearer $TOKEN")
log_response "$LIST_CUST_RESP"

# Test 5: Create Vendor
log_request "POST" "/vendors" '{"name":"ABC Suppliers"}'
VEND_RESP=$(curl -s -X POST "$API_URL/vendors" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"ABC Suppliers","email":"supplier@abc.com","phone":"+91-9876543211"}')
log_response "$VEND_RESP"
VENDOR_ID=$(echo $VEND_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Vendor ID: $VENDOR_ID"

# Test 6: List Vendors
log_request "GET" "/vendors" ""
LIST_VEND_RESP=$(curl -s -X GET "$API_URL/vendors?limit=10" -H "Authorization: Bearer $TOKEN")
log_response "$LIST_VEND_RESP"

# Test 7: Create Unit
log_request "POST" "/inventory/units" '{"code":"PCS","name":"Pieces"}'
UNIT_RESP=$(curl -s -X POST "$API_URL/inventory/units" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"code":"PCS","name":"Pieces"}')
log_response "$UNIT_RESP"
UNIT_ID=$(echo $UNIT_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Unit ID: $UNIT_ID"

# Test 8: Create Warehouse
log_request "POST" "/inventory/warehouses" '{"code":"WH01","name":"Main Warehouse"}'
WARE_RESP=$(curl -s -X POST "$API_URL/inventory/warehouses" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"code":"WH01","name":"Main Warehouse","is_default":true}')
log_response "$WARE_RESP"
WAREHOUSE_ID=$(echo $WARE_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Warehouse ID: $WAREHOUSE_ID"

# Test 9: Create Category
log_request "POST" "/inventory/categories" '{"code":"ELEC","name":"Electronics"}'
CAT_RESP=$(curl -s -X POST "$API_URL/inventory/categories" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"code":"ELEC","name":"Electronics"}')
log_response "$CAT_RESP"
CATEGORY_ID=$(echo $CAT_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Category ID: $CATEGORY_ID"

# Test 10: Create Inventory Item
log_request "POST" "/inventory/items" '{"name":"Laptop","sku":"SKU-0001"}'
ITEM_RESP=$(curl -s -X POST "$API_URL/inventory/items" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"name\":\"Laptop\",\"sku\":\"SKU-0001\",\"unit_id\":\"$UNIT_ID\",\"category_id\":\"$CATEGORY_ID\",\"standard_cost_minor\":50000,\"sale_price_minor\":60000}")
log_response "$ITEM_RESP"
ITEM_ID=$(echo $ITEM_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Item ID: $ITEM_ID"

# Test 11: List Items
log_request "GET" "/inventory/items" ""
LIST_ITEMS_RESP=$(curl -s -X GET "$API_URL/inventory/items?limit=10" -H "Authorization: Bearer $TOKEN")
log_response "$LIST_ITEMS_RESP"

# Test 12: Get Single Item
log_request "GET" "/inventory/items/$ITEM_ID" ""
GET_ITEM_RESP=$(curl -s -X GET "$API_URL/inventory/items/$ITEM_ID" -H "Authorization: Bearer $TOKEN")
log_response "$GET_ITEM_RESP"

# Test 13: Create Sales Order
log_request "POST" "/sales/orders" "customer + items"
SALES_ORDER_RESP=$(curl -s -X POST "$API_URL/sales/orders" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"customer_id\":\"$CUSTOMER_ID\",\"order_date\":\"2026-03-04\",\"items\":[{\"item_id\":\"$ITEM_ID\",\"qty\":2,\"unit_id\":\"$UNIT_ID\",\"unit_price_minor\":60000,\"tax_minor\":0}]}")
log_response "$SALES_ORDER_RESP"
SALES_ORDER_ID=$(echo $SALES_ORDER_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Sales Order ID: $SALES_ORDER_ID"

# Test 14: List Sales Orders
log_request "GET" "/sales/orders" ""
LIST_SALES_RESP=$(curl -s -X GET "$API_URL/sales/orders?limit=10" -H "Authorization: Bearer $TOKEN")
log_response "$LIST_SALES_RESP"

# Test 15: Get Sales Order
log_request "GET" "/sales/orders/$SALES_ORDER_ID" ""
GET_SALES_RESP=$(curl -s -X GET "$API_URL/sales/orders/$SALES_ORDER_ID" -H "Authorization: Bearer $TOKEN")
log_response "$GET_SALES_RESP"

# Test 16: Update Sales Order Status
log_request "PATCH" "/sales/orders/$SALES_ORDER_ID" '{"status":"confirmed"}'
UPDATE_SALES_RESP=$(curl -s -X PATCH "$API_URL/sales/orders/$SALES_ORDER_ID" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"status":"confirmed"}')
log_response "$UPDATE_SALES_RESP"

# Test 17: Create Purchase Order
log_request "POST" "/purchases/orders" "vendor + items"
PURCHASE_ORDER_RESP=$(curl -s -X POST "$API_URL/purchases/orders" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"vendor_id\":\"$VENDOR_ID\",\"order_date\":\"2026-03-04\",\"items\":[{\"item_id\":\"$ITEM_ID\",\"qty\":10,\"unit_id\":\"$UNIT_ID\",\"unit_cost_minor\":50000,\"tax_minor\":0}]}")
log_response "$PURCHASE_ORDER_RESP"
PURCHASE_ORDER_ID=$(echo $PURCHASE_ORDER_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
log "Purchase Order ID: $PURCHASE_ORDER_ID"

# Test 18: List Purchase Orders
log_request "GET" "/purchases/orders" ""
LIST_PURCHASE_RESP=$(curl -s -X GET "$API_URL/purchases/orders?limit=10" -H "Authorization: Bearer $TOKEN")
log_response "$LIST_PURCHASE_RESP"

# Test 19: Update Customer
log_request "PUT" "/customers/$CUSTOMER_ID" '{"name":"John Smith"}'
UPDATE_CUST_RESP=$(curl -s -X PUT "$API_URL/customers/$CUSTOMER_ID" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"John Smith Updated"}')
log_response "$UPDATE_CUST_RESP"

log ""
log "=============================================="
log "✅ E2E Test Complete!"
log "Log file: $LOG_FILE"
log "=============================================="
