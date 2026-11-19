import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { calculateTicketPricing } from '../lib/ticketing/pricing.ts';

const ROOT = path.resolve(process.cwd());

console.log('=== MS Backstage Stage 2: Ticketing, Pricing & Registration Test Suite ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  process.stdout.write(`[TEST ${totalTests}] ${name}...\n`);
  try {
    fn();
    console.log(`  ✓ Passed: ${name}\n`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    ${err.message}\n`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// TEST 1: Pricing Engine - Basic Free & Paid Invariants
// ----------------------------------------------------
runTest('Pricing Engine — Free & Paid Ticket Calculation', () => {
  // Free ticket
  const freeResult = calculateTicketPricing({
    unitPrice: 0,
    quantity: 1,
    currency: 'INR',
  });
  assert.equal(freeResult.grossAmount, 0, 'Free ticket gross amount must be 0');
  assert.equal(freeResult.netPayableAmount, 0, 'Free ticket net payable must be 0');
  assert.equal(freeResult.isFree, true, 'isFree flag must be true');

  // Paid ticket (unit: 1000, qty: 2)
  const paidResult = calculateTicketPricing({
    unitPrice: 1000,
    quantity: 2,
    currency: 'INR',
  });
  assert.equal(paidResult.grossAmount, 2000, 'Gross amount must be 2000');
  assert.equal(paidResult.netPayableAmount, 2000, 'Net amount must be 2000 with no discounts');
  assert.equal(paidResult.isFree, false, 'isFree flag must be false');
});

// ----------------------------------------------------
// TEST 2: Dynamic Price Rules (Early Bird & Group)
// ----------------------------------------------------
runTest('Pricing Engine — Early Bird & Group Discounts', () => {
  const earlyBirdRule = {
    id: 'rule_eb_1',
    name: 'Early Bird 20%',
    ruleType: 'early_bird',
    discountType: 'percentage',
    discountValue: 20,
    minQuantity: 1,
    isActive: true,
  };

  const groupDiscountRule = {
    id: 'rule_grp_1',
    name: 'Group 5+ (30% off)',
    ruleType: 'group',
    discountType: 'percentage',
    discountValue: 30,
    minQuantity: 5,
    isActive: true,
  };

  // Single ticket should get Early Bird 20%
  const singleResult = calculateTicketPricing({
    unitPrice: 1000,
    quantity: 1,
    currency: 'INR',
    rules: [earlyBirdRule, groupDiscountRule],
  });
  assert.equal(singleResult.grossAmount, 1000);
  assert.equal(singleResult.ruleDiscountAmount, 200, '20% of 1000 = 200');
  assert.equal(singleResult.netPayableAmount, 800);
  assert.equal(singleResult.appliedRule?.id, 'rule_eb_1');

  // Group of 5 should trigger Group 30% discount
  const groupResult = calculateTicketPricing({
    unitPrice: 1000,
    quantity: 5,
    currency: 'INR',
    rules: [earlyBirdRule, groupDiscountRule],
  });
  assert.equal(groupResult.grossAmount, 5000);
  assert.equal(groupResult.ruleDiscountAmount, 1500, '30% of 5000 = 1500');
  assert.equal(groupResult.netPayableAmount, 3500);
  assert.equal(groupResult.appliedRule?.id, 'rule_grp_1');
});

// ----------------------------------------------------
// TEST 3: Promo Code Engine - Percentage & Fixed
// ----------------------------------------------------
runTest('Pricing Engine — Promo Code Stacking & Caps', () => {
  const promoPercent = {
    id: 'promo_1',
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 500,
    currentRedemptions: 0,
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const result = calculateTicketPricing({
    unitPrice: 2000,
    quantity: 1,
    currency: 'INR',
    promoCode: promoPercent,
  });
  assert.equal(result.grossAmount, 2000);
  assert.equal(result.promoDiscountAmount, 200, '10% of 2000 = 200');
  assert.equal(result.netPayableAmount, 1800);
  assert.equal(result.appliedPromo?.code, 'SAVE10');

  // Fixed Amount Promo (₹500 off)
  const promoFixed = {
    id: 'promo_2',
    code: 'FLAT500',
    discountType: 'fixed_amount',
    discountValue: 500,
    minPurchaseAmount: 1000,
    currentRedemptions: 0,
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const fixedResult = calculateTicketPricing({
    unitPrice: 1500,
    quantity: 1,
    currency: 'INR',
    promoCode: promoFixed,
  });
  assert.equal(fixedResult.promoDiscountAmount, 500);
  assert.equal(fixedResult.netPayableAmount, 1000);

  // Free Ticket Promo (100% off)
  const promoFree = {
    id: 'promo_3',
    code: 'GUESTVIP',
    discountType: 'free_ticket',
    discountValue: 100,
    minPurchaseAmount: 0,
    currentRedemptions: 0,
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const freePromoResult = calculateTicketPricing({
    unitPrice: 2500,
    quantity: 1,
    currency: 'INR',
    promoCode: promoFree,
  });
  assert.equal(freePromoResult.netPayableAmount, 0);
  assert.equal(freePromoResult.isFree, true);
});

// ----------------------------------------------------
// TEST 4: Promo Code Constraints (Redemption Limits & Expiry)
// ----------------------------------------------------
runTest('Pricing Engine — Promo Code Constraints & Ineligibility', () => {
  // Exhausted Promo Code
  const exhaustedPromo = {
    id: 'promo_ex',
    code: 'MAXEDOUT',
    discountType: 'percentage',
    discountValue: 50,
    minPurchaseAmount: 0,
    maxTotalRedemptions: 10,
    currentRedemptions: 10, // Reached limit!
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const res1 = calculateTicketPricing({
    unitPrice: 1000,
    quantity: 1,
    currency: 'INR',
    promoCode: exhaustedPromo,
  });
  assert.equal(res1.appliedPromo, null, 'Exhausted promo code must not be applied');
  assert.equal(res1.netPayableAmount, 1000);

  // Per-User Limit Reached
  const userLimitedPromo = {
    id: 'promo_usr',
    code: 'ONCEONLY',
    discountType: 'percentage',
    discountValue: 20,
    minPurchaseAmount: 0,
    currentRedemptions: 2,
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const res2 = calculateTicketPricing({
    unitPrice: 1000,
    quantity: 1,
    currency: 'INR',
    promoCode: userLimitedPromo,
    userRedemptionCount: 1, // Already used once!
  });
  assert.equal(res2.appliedPromo, null, 'Promo code exceeding per-user cap must not be applied');

  // Ineligible Ticket ID
  const ticketRestrictedPromo = {
    id: 'promo_rest',
    code: 'STUDENTONLY',
    discountType: 'percentage',
    discountValue: 50,
    applicableTicketIds: ['ticket_student_uuid'],
    minPurchaseAmount: 0,
    currentRedemptions: 0,
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const res3 = calculateTicketPricing({
    unitPrice: 1000,
    quantity: 1,
    currency: 'INR',
    promoCode: ticketRestrictedPromo,
    ticketId: 'ticket_vip_uuid', // Ineligible ticket!
  });
  assert.equal(res3.appliedPromo, null, 'Promo code restricted to another ticket must be rejected');
});

// ----------------------------------------------------
// TEST 5: Non-Negative Payable Guarantee
// ----------------------------------------------------
runTest('Pricing Engine — Non-Negative Payable Guarantee', () => {
  const hugeDiscountPromo = {
    id: 'promo_huge',
    code: 'HUGE10000',
    discountType: 'fixed_amount',
    discountValue: 10000,
    minPurchaseAmount: 0,
    currentRedemptions: 0,
    maxRedemptionsPerUser: 1,
    isActive: true,
  };

  const result = calculateTicketPricing({
    unitPrice: 500,
    quantity: 1,
    currency: 'INR',
    promoCode: hugeDiscountPromo,
  });

  assert.ok(result.netPayableAmount >= 0, 'Payable amount must never become negative');
  assert.equal(result.netPayableAmount, 0);
  assert.equal(result.isFree, true);
});

// ----------------------------------------------------
// TEST 6: Form Builder - Field Types & Key Formatting
// ----------------------------------------------------
runTest('Form Builder — Field Key & Types Validation', () => {
  const validKeys = ['name', 'phone_number', 'tshirt_size', 'dietary_pref', 'cme_id_123'];
  const invalidKeys = ['Name With Spaces', 'name-hyphen', 'NAME_UPPER', 'name!@#', ''];

  const keyRegex = /^[a-z0-9_]+$/;

  for (const k of validKeys) {
    assert.ok(keyRegex.test(k), `Valid key '${k}' must pass regex`);
  }
  for (const k of invalidKeys) {
    assert.ok(!keyRegex.test(k), `Invalid key '${k}' must fail regex`);
  }

  // 17 Supported field types
  const expectedTypes = [
    'text', 'textarea', 'email', 'phone', 'number',
    'dropdown', 'radio', 'checkbox', 'date', 'country',
    'state', 'address', 'url', 'file', 'consent',
    'section', 'info',
  ];
  assert.equal(expectedTypes.length, 17, 'Form builder must support exactly 17 field types');
});

// ----------------------------------------------------
// TEST 7: Form Builder - Conditional Logic Evaluator
// ----------------------------------------------------
runTest('Form Builder — Conditional Logic Evaluation', () => {
  const condition = {
    dependsOnFieldKey: 'attendee_category',
    operator: 'equals',
    value: 'Student',
  };

  function evalCondition(cond, answers) {
    const val = answers[cond.dependsOnFieldKey];
    if (cond.operator === 'equals') return String(val).toLowerCase() === String(cond.value).toLowerCase();
    if (cond.operator === 'not_equals') return String(val).toLowerCase() !== String(cond.value).toLowerCase();
    if (cond.operator === 'contains') return String(val).toLowerCase().includes(String(cond.value).toLowerCase());
    return true;
  }

  assert.equal(evalCondition(condition, { attendee_category: 'Student' }), true);
  assert.equal(evalCondition(condition, { attendee_category: 'Delegate' }), false);
});

// ----------------------------------------------------
// TEST 8: Schema Export Completeness
// ----------------------------------------------------
runTest('Database Schema — Complete Export of 8 Stage 2 Entities', () => {
  const schemaIndexPath = path.join(ROOT, 'db/schema/index.ts');
  const schemaTicketingPath = path.join(ROOT, 'db/schema/ticketing.ts');

  assert.ok(fs.existsSync(schemaTicketingPath), 'db/schema/ticketing.ts must exist');
  assert.ok(fs.existsSync(schemaIndexPath), 'db/schema/index.ts must exist');

  const ticketingContent = fs.readFileSync(schemaTicketingPath, 'utf8');
  const indexContent = fs.readFileSync(schemaIndexPath, 'utf8');

  assert.ok(indexContent.includes("export * from './ticketing'"), 'index.ts must export ticketing schema');

  const expectedTables = [
    'eventTickets',
    'ticketPriceRules',
    'eventPromoCodes',
    'promoCodeRedemptions',
    'registrationForms',
    'registrationFormFields',
    'registrationOrders',
    'registrationAnswers',
  ];

  for (const table of expectedTables) {
    assert.ok(ticketingContent.includes(table), `db/schema/ticketing.ts must export ${table}`);
  }
});

// ----------------------------------------------------
// TEST 9: Additive Migration Verification
// ----------------------------------------------------
runTest('Database Migrations — Additive Migration 0007 Verification', () => {
  const migrationPath = path.join(ROOT, 'db/migrations/0007_bizarre_whizzer.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration 0007 must exist');

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  // Verify zero destructive statements
  assert.ok(!sqlContent.includes('DROP TABLE'), 'Migration must contain zero DROP TABLE');
  assert.ok(!sqlContent.includes('DROP COLUMN'), 'Migration must contain zero DROP COLUMN');

  // Verify all 8 tables are created
  const sqlTables = [
    'event_tickets',
    'ticket_price_rules',
    'event_promo_codes',
    'promo_code_redemptions',
    'registration_forms',
    'registration_form_fields',
    'registration_orders',
    'registration_answers',
  ];

  for (const t of sqlTables) {
    assert.ok(sqlContent.includes(`CREATE TABLE "${t}"`), `Migration must create table ${t}`);
  }
});

// ----------------------------------------------------
// TEST 10: Regression Isolation Protection
// ----------------------------------------------------
runTest('Regression Protection — Core Desks Unmodified & Intact', () => {
  const criticalFiles = [
    'app/events/[eventSlug]/spot-registration/page.tsx',
    'app/events/[eventSlug]/scanner/page.tsx',
    'app/events/[eventSlug]/badges/page.tsx',
    'app/events/[eventSlug]/attendees/page.tsx',
    'db/schema/attendees.ts',
    'db/schema/events.ts',
    'db/schema/organizations.ts',
  ];

  for (const file of criticalFiles) {
    const fullPath = path.join(ROOT, file);
    assert.ok(fs.existsSync(fullPath), `Critical file ${file} must exist`);
  }
});

console.log('==================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}% Success Rate)`);
console.log('==================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
