import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Allow demo accounts for testing environments unless explicitly disabled
  const isDemoForbidden = process.env.ENABLE_DEMO_ACCOUNTS === 'false';

  if (isDemoForbidden) {
    return NextResponse.json(
      { error: 'Not found' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  const demoAccounts = [
    {
      roleKey: 'platform_admin',
      roleName: 'Platform Administrator',
      email: 'admin@msbackstage.internal',
      password: process.env.DEMO_PASSWORD || 'Password123!@#',
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      description: 'Platform-level administration and oversight across all tenant organizations.',
      permittedActions: [
        'Platform management and oversight',
        'System-wide audit trail access',
        'Authorized support session assumption',
      ],
      landingPage: '/dashboard',
    },
    {
      roleKey: 'org_owner',
      roleName: 'Organization Owner',
      email: 'owner@apexevents.internal',
      password: process.env.DEMO_PASSWORD || 'Password123!@#',
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      description: 'Manage organization settings, team members, billing, and events.',
      permittedActions: [
        'Full organization administration & settings',
        'Invite, promote, and manage team members',
        'Create and configure events',
        'View organization audit logs',
      ],
      landingPage: '/organizations/apex-events',
    },
    {
      roleKey: 'event_manager',
      roleName: 'Event Manager',
      email: 'manager@apexevents.internal',
      password: process.env.DEMO_PASSWORD || 'Password123!@#',
      badgeColor: '#0891b2',
      badgeBg: '#ecfeff',
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
      password: process.env.DEMO_PASSWORD || 'Password123!@#',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5',
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
      password: process.env.DEMO_PASSWORD || 'Password123!@#',
      badgeColor: '#d97706',
      badgeBg: '#fffbeb',
      description: 'Scan attendee QR codes, verify access, and manage check-ins/check-outs.',
      permittedActions: [
        'Scan QR tokens via camera or hardware wedge',
        'Immediate attendance check-in & check-out',
        'Live scan logs & status verification',
      ],
      landingPage: '/events/apex-summit-2026/scanner',
    },
  ];

  return NextResponse.json(
    {
      enabled: true,
      environment: process.env.NODE_ENV || 'development',
      organizationSlug: 'apex-events',
      eventSlug: 'apex-summit-2026',
      accounts: demoAccounts,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
