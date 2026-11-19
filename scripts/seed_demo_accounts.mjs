import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index.js';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  platformAdministrators,
  registrationCounters,
  eventSettings,
  attendees,
} from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!@#';

const DEMO_ACCOUNTS = [
  {
    roleKey: 'platform_admin',
    roleName: 'Platform Administrator',
    email: 'admin@msbackstage.internal',
    name: 'Platform Administrator',
    description: 'Platform-level administration and oversight across all tenant organizations.',
    permittedActions: [
      'Platform management and oversight',
      'Audit trail access across system',
      'Assume tenant support session with justification',
    ],
    landingPage: '/dashboard',
  },
  {
    roleKey: 'org_owner',
    roleName: 'Organization Owner',
    email: 'owner@apexevents.internal',
    name: 'Apex Org Owner',
    description: 'Manage organization settings, team members, billing, and events.',
    permittedActions: [
      'Full organization administration & settings',
      'Invite, promote, and manage team members',
      'Create and configure events',
      'View organization audit logs',
      'Full event management across all tenant events',
    ],
    landingPage: '/organizations/apex-events',
  },
  {
    roleKey: 'event_manager',
    roleName: 'Event Manager',
    email: 'manager@apexevents.internal',
    name: 'Apex Event Manager',
    description: 'Manage event attendees, badges, staff assignments, and analytics.',
    permittedActions: [
      'Configure event settings & sequences',
      'Manage attendee directory & bulk import/export',
      'Badge design & print layout management',
      'Access event analytics & reporting',
      'Staff desk assignment management',
    ],
    landingPage: '/events/apex-summit-2026',
  },
  {
    roleKey: 'registration_staff',
    roleName: 'Registration Desk Staff',
    email: 'staff@apexevents.internal',
    name: 'Apex Registration Staff',
    description: 'Perform attendee spot registrations, badge printing, and desk operations.',
    permittedActions: [
      'Spot registration of new attendees',
      'Update attendee details & categories',
      'Print attendee badges',
      'View attendee check-in status',
    ],
    landingPage: '/events/apex-summit-2026/spot-registration',
  },
  {
    roleKey: 'scanner_operator',
    roleName: 'Scanner Operator',
    email: 'scanner@apexevents.internal',
    name: 'Apex Scanner Operator',
    description: 'Scan attendee QR codes, verify access, and manage check-ins/check-outs.',
    permittedActions: [
      'Scan QR tokens via camera or hardware wedge',
      'Immediate attendance check-in & check-out',
      'Live scan logs & status verification',
    ],
    landingPage: '/events/apex-summit-2026/scanner',
  },
];

export async function seedDemoAccounts(options = {}) {
  const isResetPasswords = options.resetPasswords || process.argv.includes('--reset-passwords');
  const isVerifyOnly = options.verifyOnly || process.argv.includes('--verify-only');

  console.log('================================================================');
  console.log('MS BACKSTAGE — DEMO ACCOUNTS SETUP & VERIFICATION');
  console.log(`Target URL: ${APP_URL}`);
  console.log(`Reset Passwords Flag: ${isResetPasswords ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Verify Only: ${isVerifyOnly ? 'YES' : 'NO'}`);
  console.log('================================================================\n');

  const userIds = {};

  // 1. Ensure/verify users in Neon Auth
  for (const account of DEMO_ACCOUNTS) {
    process.stdout.write(`Checking ${account.roleName} (${account.email})... `);

    // Check if user already signs in with DEMO_PASSWORD
    let signInRes = null;
    try {
      signInRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: APP_URL },
        body: JSON.stringify({ email: account.email, password: DEMO_PASSWORD }),
      });
    } catch (err) {
      console.error(`\nFailed to connect to ${APP_URL}. Is Next.js running? Error: ${err.message}`);
      throw err;
    }

    if (signInRes.ok) {
      const data = await signInRes.json();
      userIds[account.email] = data.user.id;
      console.log(`✓ Verified (Existing user ID: ${data.user.id})`);
    } else {
      if (isVerifyOnly) {
        console.log(`✗ Verification failed (HTTP ${signInRes.status})`);
        continue;
      }

      // Try to sign up the user
      const signUpRes = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: APP_URL },
        body: JSON.stringify({
          email: account.email,
          password: DEMO_PASSWORD,
          name: account.name,
        }),
      });

      if (signUpRes.ok) {
        const data = await signUpRes.json();
        userIds[account.email] = data.user.id;
        console.log(`✓ Created user (User ID: ${data.user.id})`);
      } else {
        // User might exist in DB with different password or unverified state
        const userQuery = await pool.query(
          'SELECT id, name FROM neon_auth.user WHERE email = $1',
          [account.email]
        );

        if (userQuery.rows.length > 0) {
          const existingId = userQuery.rows[0].id;
          userIds[account.email] = existingId;

          if (isResetPasswords) {
            console.log(`! User exists but sign-in failed. Resetting password for ${account.email}...`);
            // Lookup password hash from another verified account (e.g. admin) to update safely in dev
            const adminAcc = await pool.query(
              'SELECT password FROM neon_auth.account WHERE "userId" = $1 AND "providerId" = \'credential\'',
              [userIds['admin@msbackstage.internal'] || existingId]
            );
            if (adminAcc.rows.length > 0 && adminAcc.rows[0].password) {
              await pool.query(
                'UPDATE neon_auth.account SET password = $1 WHERE "userId" = $2 AND "providerId" = \'credential\'',
                [adminAcc.rows[0].password, existingId]
              );
              console.log(`✓ Password synchronized to verified dev hash.`);
            } else {
              console.log(`! Could not obtain reference hash. Neon Auth reset required.`);
            }
          } else {
            console.log(`! User exists in DB (ID: ${existingId}) but password differed. Pass --reset-passwords to re-align.`);
          }
        } else {
          const errData = await signUpRes.json().catch(() => ({}));
          console.error(`✗ Sign up failed: ${JSON.stringify(errData)}`);
        }
      }
    }
  }

  if (isVerifyOnly) {
    console.log('\nVerify only completed.');
    return;
  }

  // 2. Organization Fixture: "Apex Events" (slug: "apex-events")
  console.log('\n--- Ensuring Organization Fixture ---');
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, 'apex-events'))
    .limit(1);

  if (!org) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: 'Apex Events',
        slug: 'apex-events',
        isActive: true,
      })
      .returning();
    org = newOrg;
    console.log(`✓ Created organization: ${org.name} (${org.id})`);
  } else {
    if (!org.isActive) {
      await db.update(organizations).set({ isActive: true }).where(eq(organizations.id, org.id));
    }
    console.log(`✓ Verified organization: ${org.name} (${org.id})`);
  }

  // 3. Organization Memberships
  console.log('\n--- Ensuring Organization Memberships ---');
  const ownerUserId = userIds['owner@apexevents.internal'];
  if (ownerUserId) {
    const [existingOwner] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, org.id),
          eq(organizationMembers.userId, ownerUserId)
        )
      )
      .limit(1);

    if (!existingOwner) {
      await db.insert(organizationMembers).values({
        organizationId: org.id,
        userId: ownerUserId,
        role: 'owner',
        isActive: true,
      });
      console.log(`✓ Assigned Organization Owner role to ${ownerUserId}`);
    } else {
      await db
        .update(organizationMembers)
        .set({ role: 'owner', isActive: true })
        .where(eq(organizationMembers.id, existingOwner.id));
      console.log(`✓ Verified Organization Owner role for ${ownerUserId}`);
    }
  }

  // Add manager, staff, scanner as organization members
  for (const email of [
    'manager@apexevents.internal',
    'staff@apexevents.internal',
    'scanner@apexevents.internal',
  ]) {
    const uId = userIds[email];
    if (!uId) continue;
    const [existing] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, org.id),
          eq(organizationMembers.userId, uId)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(organizationMembers).values({
        organizationId: org.id,
        userId: uId,
        role: 'member',
        isActive: true,
      });
      console.log(`✓ Added tenant membership for ${email} (${uId})`);
    } else {
      await db
        .update(organizationMembers)
        .set({ isActive: true, role: 'member' })
        .where(eq(organizationMembers.id, existing.id));
      console.log(`✓ Updated tenant membership for ${email}`);
    }
  }

  // 4. Platform Administrator
  console.log('\n--- Ensuring Platform Administrator Record ---');
  const adminUserId = userIds['admin@msbackstage.internal'];
  if (adminUserId) {
    const [existingAdmin] = await db
      .select()
      .from(platformAdministrators)
      .where(eq(platformAdministrators.userId, adminUserId))
      .limit(1);

    if (!existingAdmin) {
      await db.insert(platformAdministrators).values({
        userId: adminUserId,
        email: 'admin@msbackstage.internal',
        isActive: true,
      });
      console.log(`✓ Inserted platform administrator record for ${adminUserId}`);
    } else {
      if (!existingAdmin.isActive) {
        await db
          .update(platformAdministrators)
          .set({ isActive: true })
          .where(eq(platformAdministrators.id, existingAdmin.id));
      }
      console.log(`✓ Verified platform administrator record for ${adminUserId}`);
    }
  }

  // 5. Event Fixture: "Apex Global Summit 2026" (slug: "apex-summit-2026")
  console.log('\n--- Ensuring Event Fixture ---');
  let [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, 'apex-summit-2026'))
    .limit(1);

  if (!event) {
    const [newEvent] = await db
      .insert(events)
      .values({
        organizationId: org.id,
        name: 'Apex Global Summit 2026',
        slug: 'apex-summit-2026',
        venue: 'Grand Convention Center, Hall A & B',
        status: 'published',
      })
      .returning();
    event = newEvent;
    console.log(`✓ Created event: ${event.name} (${event.id})`);
  } else {
    console.log(`✓ Verified event: ${event.name} (${event.id})`);
  }

  // 6. Event Staff Assignments
  console.log('\n--- Ensuring Event Staff Assignments ---');
  const staffRoles = [
    { email: 'manager@apexevents.internal', role: 'event_manager' },
    { email: 'staff@apexevents.internal', role: 'registration_staff' },
    { email: 'scanner@apexevents.internal', role: 'scanner_operator' },
  ];

  for (const { email, role } of staffRoles) {
    const uId = userIds[email];
    if (!uId) continue;

    const [existingStaff] = await db
      .select()
      .from(eventStaffAssignments)
      .where(
        and(
          eq(eventStaffAssignments.eventId, event.id),
          eq(eventStaffAssignments.userId, uId)
        )
      )
      .limit(1);

    if (!existingStaff) {
      await db.insert(eventStaffAssignments).values({
        eventId: event.id,
        userId: uId,
        role,
        isActive: true,
      });
      console.log(`✓ Assigned ${role} to ${email} (${uId})`);
    } else {
      await db
        .update(eventStaffAssignments)
        .set({ role, isActive: true })
        .where(eq(eventStaffAssignments.id, existingStaff.id));
      console.log(`✓ Verified ${role} for ${email} (${uId})`);
    }
  }

  // 7. Registration Counters Fixtures
  console.log('\n--- Ensuring Registration Counters ---');
  const counters = [
    { key: 'faculty_counter', name: 'Faculty Counter', prefix: 'FAC', start: 1, next: 10 },
    { key: 'delegate_counter', name: 'Delegate Counter', prefix: 'DEL', start: 1, next: 20 },
    { key: 'spot_counter', name: 'Spot Registration Counter', prefix: 'SPT', start: 1, next: 5 },
  ];

  for (const c of counters) {
    const [existingC] = await db
      .select()
      .from(registrationCounters)
      .where(
        and(
          eq(registrationCounters.eventId, event.id),
          eq(registrationCounters.counterKey, c.key)
        )
      )
      .limit(1);

    if (!existingC) {
      await db.insert(registrationCounters).values({
        eventId: event.id,
        counterKey: c.key,
        displayName: c.name,
        prefix: c.prefix,
        startValue: c.start,
        nextValue: c.next,
        padding: 4,
      });
      console.log(`✓ Created counter: ${c.name} (${c.prefix})`);
    }
  }

  // 8. Event Settings Fixture
  console.log('\n--- Ensuring Badge Layout Setting ---');
  const [existingSetting] = await db
    .select()
    .from(eventSettings)
    .where(
      and(
        eq(eventSettings.eventId, event.id),
        eq(eventSettings.key, 'badge_layout')
      )
    )
    .limit(1);

  if (!existingSetting) {
    await db.insert(eventSettings).values({
      eventId: event.id,
      key: 'badge_layout',
      value: {
        width: 100,
        height: 140,
        unit: 'mm',
        orientation: 'portrait',
        elements: [
          { type: 'text', field: 'name', fontSize: 18, fontWeight: 'bold', x: 10, y: 30 },
          { type: 'text', field: 'category', fontSize: 12, fontWeight: 'normal', x: 10, y: 45 },
          { type: 'qrcode', field: 'qr_token', size: 40, x: 30, y: 60 },
        ],
      },
    });
    console.log(`✓ Created badge_layout setting`);
  }

  // 9. Sample Attendees Fixture
  console.log('\n--- Ensuring Sample Attendee Test Fixtures ---');
  const existingAttendees = await db
    .select()
    .from(attendees)
    .where(eq(attendees.eventId, event.id));

  if (existingAttendees.length < 5) {
    const sampleAttendees = [
      {
        eventId: event.id,
        registrationNumber: 'REG-APEX-001',
        name: 'Dr. Vikram Sarabhai',
        category: 'Faculty',
        phoneNumber: '+919876543201',
        email: 'vikram@isro.gov.in',
        foodPreference: 'Vegetarian',
        paymentStatus: 'Paid',
        registrationType: 'pre_registered',
        attendanceStatus: 'checked_in',
      },
      {
        eventId: event.id,
        registrationNumber: 'REG-APEX-002',
        name: 'Ananya Roy',
        category: 'Delegate',
        phoneNumber: '+919876543202',
        email: 'ananya.roy@techsummit.org',
        foodPreference: 'Non-Vegetarian',
        paymentStatus: 'Paid',
        registrationType: 'pre_registered',
        attendanceStatus: 'not_checked_in',
      },
      {
        eventId: event.id,
        registrationNumber: 'REG-APEX-003',
        name: 'Rahul Verma',
        category: 'Postgraduate',
        phoneNumber: '+919876543203',
        email: 'rahul.verma@aiims.edu',
        foodPreference: 'Jain Food',
        paymentStatus: 'Unpaid',
        registrationType: 'spot',
        attendanceStatus: 'not_checked_in',
      },
      {
        eventId: event.id,
        registrationNumber: 'REG-APEX-004',
        name: 'Kavita Patel',
        category: 'Delegate',
        phoneNumber: '+919876543204',
        email: 'kavita@biomedical.org',
        foodPreference: 'Vegetarian',
        paymentStatus: 'Paid',
        registrationType: 'pre_registered',
        attendanceStatus: 'checked_out',
      },
      {
        eventId: event.id,
        registrationNumber: 'REG-APEX-005',
        name: 'David Miller',
        category: 'Exhibitor',
        phoneNumber: '+919876543205',
        email: 'david@medequipment.com',
        foodPreference: 'Vegan',
        paymentStatus: 'Complimentary',
        registrationType: 'pre_registered',
        attendanceStatus: 'not_checked_in',
      },
    ];

    for (const att of sampleAttendees) {
      const [found] = await db
        .select()
        .from(attendees)
        .where(
          and(
            eq(attendees.eventId, event.id),
            eq(attendees.registrationNumber, att.registrationNumber)
          )
        )
        .limit(1);

      if (!found) {
        await db.insert(attendees).values(att);
        console.log(`✓ Inserted attendee: ${att.registrationNumber} (${att.name} - ${att.attendanceStatus})`);
      }
    }
  } else {
    console.log(`✓ Verified ${existingAttendees.length} existing attendees for ${event.slug}`);
  }

  // 10. Summary Verification
  console.log('\n================================================================');
  console.log('DEMO ACCOUNTS VERIFICATION SUMMARY:');
  console.log('================================================================');
  for (const acc of DEMO_ACCOUNTS) {
    const id = userIds[acc.email];
    console.log(`[${acc.roleName.padEnd(25)}] -> ${acc.email} (ID: ${id || 'MISSING'})`);
  }
  console.log(`Tenant Org : Apex Events (slug: apex-events, ID: ${org.id})`);
  console.log(`Test Event : Apex Global Summit 2026 (slug: apex-summit-2026, ID: ${event.id})`);
  console.log('================================================================\n');
}

// Execute standalone
seedDemoAccounts()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });

