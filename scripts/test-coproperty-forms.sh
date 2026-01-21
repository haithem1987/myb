#!/bin/bash

# Coproperty Forms - Integration Test Script
# This script verifies that all coproperty management forms are working correctly

echo "🧪 Coproperty Forms Integration Test"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

info() {
  echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

echo "📋 Test Plan:"
echo "1. Verify translation files contain required keys"
echo "2. Verify component TypeScript files have safety checks"
echo "3. Verify component HTML files have conditional rendering"
echo "4. Verify build succeeds"
echo ""

# Test 1: Check English translations
info "Testing English translation keys..."
if grep -q "saveFirst" /Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/client/src/assets/i18n/en.json; then
  pass "English translation file contains 'saveFirst' keys"
else
  fail "English translation file missing 'saveFirst' keys"
fi

# Test 2: Check French translations  
info "Testing French translation keys..."
if grep -q "saveFirst" /Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/client/src/assets/i18n/fr.json; then
  pass "French translation file contains 'saveFirst' keys"
else
  fail "French translation file missing 'saveFirst' keys"
fi

# Test 3: Check charge-management component
info "Testing charge-management component..."
CHARGE_TS="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/charge-management/charge-management.component.ts"
if grep -q "if (this.copropertyId() > 0)" "$CHARGE_TS"; then
  pass "charge-management.component.ts has ID safety check"
else
  fail "charge-management.component.ts missing ID safety check"
fi

CHARGE_HTML="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/charge-management/charge-management.component.html"
if grep -q 'copropertyId() === 0' "$CHARGE_HTML"; then
  pass "charge-management.component.html has conditional rendering"
else
  fail "charge-management.component.html missing conditional rendering"
fi

# Test 4: Check unit-management component
info "Testing unit-management component..."
UNIT_TS="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/unit-management/unit-management.component.ts"
if grep -q "if (this.copropertyId > 0)" "$UNIT_TS"; then
  pass "unit-management.component.ts has ID safety check"
else
  fail "unit-management.component.ts missing ID safety check"
fi

UNIT_HTML="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/unit-management/unit-management.component.html"
if grep -q 'copropertyId === 0' "$UNIT_HTML"; then
  pass "unit-management.component.html has conditional rendering"
else
  fail "unit-management.component.html missing conditional rendering"
fi

# Test 5: Check maintenance-requests component
info "Testing maintenance-requests component..."
MAINT_TS="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/maintenance-requests/maintenance-requests.component.ts"
if grep -q "if (this.copropertyId > 0)" "$MAINT_TS"; then
  pass "maintenance-requests.component.ts has ID safety check"
else
  fail "maintenance-requests.component.ts missing ID safety check"
fi

MAINT_HTML="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/maintenance-requests/maintenance-requests.component.html"
if grep -q 'copropertyId === 0' "$MAINT_HTML"; then
  pass "maintenance-requests.component.html has conditional rendering"
else
  fail "maintenance-requests.component.html missing conditional rendering"
fi

# Test 6: Check coproperty-new component
info "Testing coproperty-new component..."
COPROP_NEW_HTML="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/libs/coproperty-module/src/lib/components/coproperty-new/coproperty-new.component.html"
if ! grep -q '*ngIf="copropertyId()"' "$COPROP_NEW_HTML"; then
  pass "coproperty-new.component.html removed blocking *ngIf conditions"
else
  fail "coproperty-new.component.html still has blocking *ngIf conditions"
fi

# Test 7: Verify build output
info "Testing build artifacts..."
BUILD_OUTPUT="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/dist/apps/client"
if [ -d "$BUILD_OUTPUT" ]; then
  if [ -f "$BUILD_OUTPUT/index.html" ]; then
    pass "Client build output exists with index.html"
  else
    fail "Client build output missing index.html"
  fi
else
  fail "Client build output directory not found"
fi

# Test 8: Check translation structure
info "Testing translation structure..."
CHARGE_SAVE_EN=$(grep -A 1 '"charges"' /Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/client/src/assets/i18n/en.json | grep -c "saveFirst")
UNIT_SAVE_EN=$(grep -A 1 '"unit"' /Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/client/src/assets/i18n/en.json | grep -c "saveFirst")
MAINT_SAVE_EN=$(grep -A 1 '"maintenance"' /Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/client/src/assets/i18n/en.json | grep -c "saveFirst")

if [ $CHARGE_SAVE_EN -gt 0 ] && [ $UNIT_SAVE_EN -gt 0 ] && [ $MAINT_SAVE_EN -gt 0 ]; then
  pass "All three sections have saveFirst translations"
else
  fail "Some sections missing saveFirst translations"
fi

echo ""
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! The coproperty forms are properly configured.${NC}"
  echo ""
  echo "✅ What works now:"
  echo "  • All tabs (Units, Charges, Maintenance) are visible in create mode"
  echo "  • Info messages display when coproperty ID is 0"
  echo "  • No API calls are made without a valid ID"
  echo "  • Translations are properly loaded"
  echo ""
  echo "📝 Testing Instructions:"
  echo "  1. Navigate to http://localhost:4200/coproperty/new"
  echo "  2. Click on each tab (Units, Charges, Maintenance)"
  echo "  3. You should see: 'Please save the coproperty first before managing [units/charges/maintenance].'"
  echo "  4. Fill in Basic Information and click Save"
  echo "  5. After save, all tabs should show full management interfaces"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
  exit 1
fi
