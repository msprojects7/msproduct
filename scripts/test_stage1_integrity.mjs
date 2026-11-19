import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  events,
  registrationCounters,
  attendees,
  importBatches,
  scanEvents,
  badgePrintEvents,
  spotRegistrationKeys,
  auditEvents,
} from '../db/schema/index';
import { eq, sql } from 'drizzle-orm';

async function runTests() {
  console.log('====================================================');
  console.log('MS BACKSTAGE — STAGE 1 DATABASE INTEGRITY & CONCURRENCY TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  const testOrgAId = '11111111-1111-4111-8111-111111111111';
  const testOrgBId = '22222222-2222-4222-8222-222222222222';
  const testEventAId = '33333333-3333-4333-8333-333333333333';
  const testEventBId = '44444444-4444-4444-8444-444444444444';

  try {
    // Clean up any previous test records
    await db.delete(auditEvents).where(sql`${auditEvents.organizationId} IN (${testOrgAId}, ${testOrgBId})`);
    await db.delete(events).where(sql`${events.id} IN (${testEventAId}, ${testEventBId})`);
    await db.delete(organizations).where(sql`${organizations.id} IN (${testOrgAId}, ${testOrgBId})`);

    // TEST 1: Tenant & Event Isolation and Unique Slugs
    console.log('[TEST 1] Tenant & Event creation with scoped slugs...');
    await db.insert(organizations).values([
      { id: testOrgAId, name: 'Test Org Alpha', slug: 'org-alpha' },
      { id: testOrgBId, name: 'Test Org Beta', slug: 'org-beta' },
    ]);
    await db.insert(events).values([
      { id: testEventAId, organizationId: testOrgAId, name: 'Event A1', slug: 'annual-conf' },
      { id: testEventBId, organizationId: testOrgBId, name: 'Event B1', slug: 'annual-conf' }, // Same slug allowed across different orgs
    ]);

    let duplicateOrgSlugError = false;
    try {
      await db.insert(organizations).values({ name: 'Duplicate Org', slug: 'org-alpha' });
    } catch {
      duplicateOrgSlugError = true;
    }
    assert(duplicateOrgSlugError, 'Global unique constraint on organization slug is strictly enforced');

    let duplicateEventSlugSameOrgError = false;
    try {
      await db.insert(events).values({ organizationId: testOrgAId, name: 'Duplicate Event Slug', slug: 'annual-conf' });
    } catch {
      duplicateEventSlugSameOrgError = true;
    }
    assert(duplicateEventSlugSameOrgError, 'Unique slug per organization constraint is strictly enforced');

    // TEST 2: Cross-Event Foreign-Key Integrity
    console.log('\n[TEST 2] Cross-event referential integrity verification...');
    const testAttendeeAId = '55555555-5555-4555-8555-555555555555';
    await db.insert(attendees).values({
      id: testAttendeeAId,
      eventId: testEventAId,
      registrationNumber: 'TEST-0001',
      name: 'John Doe (Event A)',
      category: 'Delegate',
    });

    let crossEventScanError = false;
    try {
      // Intentionally attempt to link Attendee A1 (Event A) to a scan in Event B!
      await db.insert(scanEvents).values({
        eventId: testEventBId, // Mismatching event ID!
        attendeeId: testAttendeeAId,
        action: 'check_in',
        staffUserId: 'staff_1',
      });
    } catch (err) {
      crossEventScanError = true;
    }
    assert(crossEventScanError, 'Cross-event scan_events insert rejected by composite foreign key (attendee_id, event_id)');

    let crossEventPrintError = false;
    try {
      // Intentionally attempt to link Attendee A1 (Event A) to a badge print in Event B!
      await db.insert(badgePrintEvents).values({
        eventId: testEventBId, // Mismatching event ID!
        attendeeId: testAttendeeAId,
        printType: 'single',
        staffUserId: 'staff_1',
      });
    } catch (err) {
      crossEventPrintError = true;
    }
    assert(crossEventPrintError, 'Cross-event badge_print_events insert rejected by composite foreign key');

    let crossEventSpotKeyError = false;
    try {
      // Intentionally attempt to link Attendee A1 (Event A) to spot key in Event B!
      await db.insert(spotRegistrationKeys).values({
        eventId: testEventBId,
        idempotencyKey: 'idemp-cross-test',
        attendeeId: testAttendeeAId,
      });
    } catch (err) {
      crossEventSpotKeyError = true;
    }
    assert(crossEventSpotKeyError, 'Cross-event spot_registration_keys insert rejected by composite foreign key');

    // TEST 3: Correct Composite Foreign-Key ON DELETE SET NULL for import batches
    console.log('\n[TEST 3] Import batch ON DELETE SET NULL verification...');
    const testBatchId = '66666666-6666-4666-8666-666666666666';
    await db.insert(importBatches).values({
      id: testBatchId,
      eventId: testEventAId,
      fileName: 'delegates.xlsx',
      createdBy: 'admin_user',
    });

    const testAttendeeWithBatchId = '77777777-7777-4777-8777-777777777777';
    await db.insert(attendees).values({
      id: testAttendeeWithBatchId,
      eventId: testEventAId,
      registrationNumber: 'TEST-0002',
      name: 'Jane Smith (With Batch)',
      category: 'Faculty',
      importBatchId: testBatchId,
    });

    // Delete import batch
    await db.delete(importBatches).where(eq(importBatches.id, testBatchId));

    const [updatedAttendee] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, testAttendeeWithBatchId));

    assert(
      updatedAttendee !== undefined && updatedAttendee.importBatchId === null,
      'Attendee import_batch_id was cleanly SET NULL when batch was deleted (no composite FK error)'
    );

    // TEST 4: Transaction-Safe Interactive SELECT FOR UPDATE Concurrency
    console.log('\n[TEST 4] Registration sequence concurrency with SELECT FOR UPDATE...');
    const testCounterId = '88888888-8888-4888-8888-888888888888';
    await db.insert(registrationCounters).values({
      id: testCounterId,
      eventId: testEventAId,
      counterKey: 'delegate_counter',
      displayName: 'Delegates',
      prefix: 'DEL-26',
      startValue: 100,
      nextValue: 100,
      padding: 4,
    });

    // Concurrently allocate numbers from 5 parallel workers
    const allocateNumber = async (workerId) => {
      return await db.transaction(async (tx) => {
        // Interactive row lock
        const res = await tx.execute(
          sql`SELECT id, next_value, prefix, padding FROM registration_counters WHERE id = ${testCounterId} FOR UPDATE`
        );
        const row = res.rows[0];
        const assignedValue = row.next_value;
        const formattedRegNumber = `${row.prefix}-${String(assignedValue).padStart(row.padding, '0')}`;

        // Increment counter
        await tx.execute(
          sql`UPDATE registration_counters SET next_value = next_value + 1, last_used_value = ${assignedValue}, updated_at = NOW() WHERE id = ${testCounterId}`
        );

        return { workerId, assignedValue, formattedRegNumber };
      });
    };

    const results = await Promise.all([
      allocateNumber(1),
      allocateNumber(2),
      allocateNumber(3),
      allocateNumber(4),
      allocateNumber(5),
    ]);

    const allocatedValues = results.map((r) => r.assignedValue).sort((a, b) => a - b);
    const uniqueValues = new Set(allocatedValues);

    assert(
      uniqueValues.size === 5 &&
        allocatedValues[0] === 100 &&
        allocatedValues[4] === 104,
      `All 5 concurrent workers received sequential, collision-free numbers: ${allocatedValues.join(', ')}`
    );

    // TEST 5: Audit Log Non-Destructive Retention
    console.log('\n[TEST 5] Non-destructive audit-log retention verification...');
    const testAuditId = '99999999-9999-4999-8999-999999999999';
    await db.insert(auditEvents).values({
      id: testAuditId,
      organizationId: testOrgAId,
      eventId: testEventAId,
      userId: 'user_surya',
      action: 'counter_incremented',
      entityType: 'registration_counters',
      entityId: testCounterId,
      details: {
        event_slug_snapshot: 'annual-conf',
        allocated_values: allocatedValues,
      },
    });

    // Test RESTRICT on organization deletion
    let orgDeleteRestrictError = false;
    try {
      await db.delete(organizations).where(eq(organizations.id, testOrgAId));
    } catch {
      orgDeleteRestrictError = true;
    }
    assert(orgDeleteRestrictError, 'Deleting organization with audit logs is blocked by ON DELETE RESTRICT');

    // Test SET NULL on event deletion
    // Remove attendees and counters so event can be deleted
    await db.delete(attendees).where(eq(attendees.eventId, testEventAId));
    await db.delete(registrationCounters).where(eq(registrationCounters.eventId, testEventAId));
    await db.delete(events).where(eq(events.id, testEventAId));

    const [auditRecordAfterEventDelete] = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.id, testAuditId));

    assert(
      auditRecordAfterEventDelete !== undefined &&
        auditRecordAfterEventDelete.eventId === null &&
        auditRecordAfterEventDelete.details?.event_slug_snapshot === 'annual-conf',
      'Audit log retained completely with event_id set to NULL and snapshot preserved after event deletion'
    );

    // Clean up
    await db.delete(auditEvents).where(eq(auditEvents.id, testAuditId));
    await db.delete(events).where(sql`${events.id} IN (${testEventAId}, ${testEventBId})`);
    await db.delete(organizations).where(sql`${organizations.id} IN (${testOrgAId}, ${testOrgBId})`);
    console.log('\n✓ Test records cleaned up successfully.');

  } catch (error) {
    console.error('\nUnexpected error during integrity tests:', error);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
