import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import { organizations, organizationMembers, events, attendees } from '../db/schema/index';
import { eq } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function seedBrowserTest() {
  const email = 'browser-tester@example.com';
  const password = 'Password123!@#Test';

  // 1. Sign up user
  const signUpRes = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
    body: JSON.stringify({ email, password, name: 'Browser QA Tester' }),
  });
  const signUpData = await signUpRes.json();
  const setCookies = signUpRes.headers.getSetCookie?.() || [signUpRes.headers.get('set-cookie') || ''];
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');

  let userId = signUpData.user?.id;
  if (!userId) {
    // If user already exists, sign in
    const signInRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email, password }),
    });
    const signInData = await signInRes.json();
    userId = signInData.user?.id;
  }

  // 2. Create organization
  const orgSlug = 'browser-test-org';
  const eventSlug = 'browser-test-event';

  // Clean old if exists
  const existingOrg = await db.query?.organizations?.findFirst?.({
    where: eq(organizations.slug, orgSlug),
  }) || (await db.select().from(organizations).where(eq(organizations.slug, orgSlug)))[0];

  let orgId = existingOrg?.id;
  if (!orgId) {
    const [newOrg] = await db.insert(organizations).values({
      name: 'Browser Testing Org',
      slug: orgSlug,
      isActive: true,
    }).returning();
    orgId = newOrg.id;

    await db.insert(organizationMembers).values({
      organizationId: orgId,
      userId,
      role: 'owner',
      isActive: true,
    });
  }

  // Clean old event if exists
  const existingEvent = (await db.select().from(events).where(eq(events.slug, eventSlug)))[0];
  let eventId = existingEvent?.id;
  if (!eventId) {
    const [newEvent] = await db.insert(events).values({
      organizationId: orgId,
      name: 'Browser Testing Summit 2026',
      slug: eventSlug,
    }).returning();
    eventId = newEvent.id;
  }

  // Clean existing attendees for clean run
  await db.delete(attendees).where(eq(attendees.eventId, eventId));

  // Insert 6 seed attendees
  await db.insert(attendees).values([
    {
      eventId,
      registrationNumber: 'REG-101',
      name: 'Dr. Aris Thorne',
      category: 'Faculty',
      phoneNumber: '+919876543210',
      email: 'aris.thorne@summit.org',
      foodPreference: 'Vegetarian',
      paymentStatus: 'Paid',
      registrationType: 'pre_registered',
      attendanceStatus: 'checked_in',
    },
    {
      eventId,
      registrationNumber: 'REG-102',
      name: 'Elena Rostova',
      category: 'Delegate',
      phoneNumber: '+919876543211',
      email: 'elena@biomed.ac.uk',
      foodPreference: 'Non-Vegetarian',
      paymentStatus: 'Paid',
      registrationType: 'pre_registered',
      attendanceStatus: 'not_checked_in',
    },
    {
      eventId,
      registrationNumber: 'REG-103',
      name: 'Marcus Vance',
      category: 'Postgraduate',
      phoneNumber: '+919876543212',
      email: 'mvance@medu.edu',
      foodPreference: 'Jain Food',
      paymentStatus: 'Unpaid',
      registrationType: 'spot',
      attendanceStatus: 'not_checked_in',
    },
    {
      eventId,
      registrationNumber: 'REG-104',
      name: 'Sophia Chen',
      category: 'Accompanying',
      phoneNumber: '+919876543213',
      email: 'sophia.c@design.io',
      foodPreference: 'Vegetarian',
      paymentStatus: 'Complimentary',
      registrationType: 'pre_registered',
      attendanceStatus: 'not_checked_in',
    },
    {
      eventId,
      registrationNumber: 'REG-105',
      name: 'Devon Miller',
      category: 'Delegate',
      phoneNumber: '+919876543214',
      email: 'devon@millerlabs.com',
      foodPreference: 'Vegan',
      paymentStatus: 'Paid',
      registrationType: 'pre_registered',
      attendanceStatus: 'checked_out',
    },
    {
      eventId,
      registrationNumber: 'REG-106',
      name: 'Priya Sharma',
      category: 'Faculty',
      phoneNumber: '+919876543215',
      email: 'priya@aiims.edu',
      foodPreference: 'Vegetarian',
      paymentStatus: 'Paid',
      registrationType: 'spot',
      attendanceStatus: 'checked_in',
    },
  ]);

  console.log('Seeded browser test data successfully:');
  console.log(`User: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Event Slug: ${eventSlug}`);
  console.log(`URL: ${APP_URL}/events/${eventSlug}/attendees`);
}

seedBrowserTest().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
