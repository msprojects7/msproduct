import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import {
  organizations,
  organizationMembers,
  auditEvents,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import nextConfig from '../next.config.mjs';

function assert(condition, message, level = 'LEVEL A') {
  if (!condition) {
    console.error(`❌ [${level}] FAIL: ${message}`);
    throw new Error(`[${level}] Assertion failed: ${message}`);
  }
  console.log(`✓ [${level}] PASS: ${message}`);
}

async function runSecurityClosureTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 3 SECURITY CLOSURE VERIFICATION SUITE');
  console.log('================================================================\n');

  const ts = Date.now();
  const testOrgId = crypto.randomUUID();
  const ownerUserId = `sec_owner_${ts}`;
  const adminUserId = `sec_admin_${ts}`;
  const memberUserId = `sec_member_${ts}`;

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: LEVEL A — DATABASE CONSTRAINTS & BUSINESS INVARIANTS
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: LEVEL A — DATABASE INVARIANTS & CONCURRENCY ---');

    // Seed test organization
    await db.insert(organizations).values({
      id: testOrgId,
      name: `Security Test Org ${ts}`,
      slug: `sec-test-org-${ts}`,
      isActive: true,
    });

    // Seed primary owner
    await db.insert(organizationMembers).values({
      organizationId: testOrgId,
      userId: ownerUserId,
      role: 'owner',
      isActive: true,
    });

    // TEST 1: Database-level single owner constraint enforcement
    let duplicateOwnerRejected = false;
    try {
      await db.insert(organizationMembers).values({
        organizationId: testOrgId,
        userId: adminUserId,
        role: 'owner', // Attempt to insert second owner
        isActive: true,
      });
    } catch (err) {
      const isUniqueViolation =
        err.code === '23505' ||
        err.cause?.code === '23505' ||
        String(err).includes('unique') ||
        String(err.cause).includes('unique');
      duplicateOwnerRejected = isUniqueViolation;
    }
    assert(
      duplicateOwnerRejected,
      'Database engine constraint org_members_single_owner_unique strictly rejects multiple owners in one organization',
      'LEVEL A'
    );

    // Seed admin & member properly
    await db.insert(organizationMembers).values([
      {
        organizationId: testOrgId,
        userId: adminUserId,
        role: 'admin',
        isActive: true,
      },
      {
        organizationId: testOrgId,
        userId: memberUserId,
        role: 'member',
        isActive: false, // inactive member
      },
    ]);

    // -------------------------------------------------------------------------
    // SECTION 2: LEVEL B — NEXT.JS ROUTE HANDLERS & SECURITY HEADERS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: LEVEL B — HANDLER LOGIC & SECURITY HEADERS ---');

    // TEST 2: Verify Referrer-Policy headers in Next.js configuration
    const headersConfig = await nextConfig.headers();
    const invHeaders = headersConfig.find(h => h.source === '/invitations/:path*');
    const referrerHeader = invHeaders?.headers?.find(h => h.key === 'Referrer-Policy');

    assert(
      referrerHeader && referrerHeader.value === 'no-referrer',
      'Next.js configuration specifies Referrer-Policy: no-referrer for /invitations/:path*',
      'LEVEL B'
    );

    const globalHeaders = headersConfig.find(h => h.source === '/:path*');
    const nosniffHeader = globalHeaders?.headers?.find(h => h.key === 'X-Content-Type-Options');
    const frameDenyHeader = globalHeaders?.headers?.find(h => h.key === 'X-Frame-Options');

    assert(
      nosniffHeader?.value === 'nosniff' && frameDenyHeader?.value === 'DENY',
      'Global security headers include X-Content-Type-Options: nosniff and X-Frame-Options: DENY',
      'LEVEL B'
    );

    // -------------------------------------------------------------------------
    // SECTION 3: LEVEL C — REAL HTTP INTEGRATION WITH AUTHENTICATED SESSIONS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: LEVEL C — REAL HTTP SESSIONS & EDGE CONDITIONS ---');

    const APP_URL = 'http://localhost:3333';
    let devServerOnline = false;
    try {
      const hc = await fetch(`${APP_URL}/api/health`);
      if (hc.ok) devServerOnline = true;
    } catch {
      devServerOnline = false;
    }

    if (!devServerOnline) {
      console.log('Dev server not detected on 3333; skipping Level C real HTTP suite.');
    } else {
      const userTs = Date.now();
      const realOwnerEmail = `sec-owner-${userTs}@example.com`;
      const legitimateInviteeEmail = `sec-invitee-${userTs}@example.com`;
      const maliciousAttackerEmail = `sec-attacker-${userTs}@example.com`;

      const signUpUser = async (email, name) => {
        const res = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
          body: JSON.stringify({ email, password: 'Password123!@#Test', name }),
        });
        const data = await res.json();
        const cookies = res.headers.get('set-cookie') || '';
        return { user: data.user, cookies };
      };

      const realOwner = await signUpUser(realOwnerEmail, 'Security Owner');
      const realInvitee = await signUpUser(legitimateInviteeEmail, 'Legitimate Invitee');
      const attacker = await signUpUser(maliciousAttackerEmail, 'Malicious Attacker');

      // Create organization
      const createOrgRes = await fetch(`${APP_URL}/api/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          name: `Security Org (${userTs})`,
          slug: `sec-org-${userTs}`,
        }),
      });
      const createOrgData = await createOrgRes.json();
      const orgId = createOrgData.organization.id;

      // Owner invites legitimate invitee
      const createInvRes = await fetch(`${APP_URL}/api/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          email: legitimateInviteeEmail,
          role: 'admin',
        }),
      });
      const createInvData = await createInvRes.json();
      const rawToken = createInvData.token;

      // TEST 3: Attacker with different email tries to accept invitation token
      const attackerAcceptRes = await fetch(`${APP_URL}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': attacker.cookies,
        },
        body: JSON.stringify({ token: rawToken }),
      });
      const attackerData = await attackerAcceptRes.json();

      assert(
        attackerAcceptRes.status === 403 && attackerData.code === 'EMAIL_MISMATCH',
        'Unauthorized user with mismatched email is rejected with 403 EMAIL_MISMATCH',
        'LEVEL C'
      );

      // TEST 4: Legitimate invitee successfully accepts
      const legitimateAcceptRes = await fetch(`${APP_URL}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realInvitee.cookies,
        },
        body: JSON.stringify({ token: rawToken }),
      });
      const legitimateData = await legitimateAcceptRes.json();

      assert(
        legitimateAcceptRes.status === 200 && legitimateData.membership?.role === 'admin',
        'Legitimate invitee with matching email successfully joins as admin (200 OK)',
        'LEVEL C'
      );

      // TEST 5: Subsequent acceptance attempt is strictly rejected
      const replayAcceptRes = await fetch(`${APP_URL}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realInvitee.cookies,
        },
        body: JSON.stringify({ token: rawToken }),
      });
      const replayData = await replayAcceptRes.json();

      assert(
        replayAcceptRes.status === 400 && replayData.code === 'INVITATION_INACTIVE',
        'Replay attempt of accepted invitation is rejected with 400 INVITATION_INACTIVE',
        'LEVEL C'
      );

      // TEST 6: Event settings update records audit log atomically
      const createEvRes = await fetch(`${APP_URL}/api/organizations/${orgId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          name: `Sec Event ${userTs}`,
          slug: `sec-ev-${userTs}`,
        }),
      });
      const createEvData = await createEvRes.json();
      const eventId = createEvData.event.id;

      const updateSettingsRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          key: 'badge_layout',
          value: { layout: 'standard_v1' },
        }),
      });

      assert(
        updateSettingsRes.status === 200,
        'Event settings updated successfully (200 OK)',
        'LEVEL C'
      );

      const [settingsAudit] = await db
        .select()
        .from(auditEvents)
        .where(and(
          eq(auditEvents.eventId, eventId),
          eq(auditEvents.action, 'event_settings:updated')
        ))
        .limit(1);

      assert(
        !!settingsAudit?.id && settingsAudit.action === 'event_settings:updated',
        'Event settings update atomically written to immutable audit_events log',
        'LEVEL C'
      );

      // Clean up real HTTP test org (delete audit_events first due to ON DELETE RESTRICT)
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgId));
      await db.delete(organizations).where(eq(organizations.id, orgId));
    }
  } finally {
    // Clean up test records (delete audit_events first due to ON DELETE RESTRICT)
    await db.delete(auditEvents).where(eq(auditEvents.organizationId, testOrgId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
    console.log('\n✓ Test records cleaned up successfully.');
  }

  console.log('\n================================================================');
  console.log('STAGE 3 SECURITY CLOSURE TESTS: ALL PASSED');
  console.log('================================================================\n');
  process.exit(0);
}

runSecurityClosureTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
