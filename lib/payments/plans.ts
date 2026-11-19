/**
 * MS Backstage — Configurable Subscription Plan Tiers
 *
 * Client-safe definitions and server-side entitlements for conference operations.
 * Business Model:
 * - Free: 50 attendees (₹0)
 * - Pro: 1,000 attendees (₹2,000 / event)
 * - Pro Max: 5,000 attendees (₹5,000 / event, configurable)
 * - Lifetime: Custom commercial terms (Contact Sales)
 */

export interface PlanTier {
  id: string;
  name: string;
  priceInPenceOrPaise: number; // in paise for INR (1 INR = 100 paise)
  priceFormatted: string;
  currency: string;
  billingUnit: string;
  validityDuration: string; // e.g. "15 Days", "1 Month (30 Days)", "Perpetual"
  maxAttendees: number;
  maxEvents: number;
  badge: string;
  description: string;
  features: string[];
  ctaLabel: string;
  popular?: boolean;
  extraAttendeePriceInPaise?: number; // 2000 paise = ₹20 per attendee over limit
}

export const PLAN_TIERS: Record<string, PlanTier> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    priceInPenceOrPaise: 0,
    priceFormatted: '₹0',
    currency: 'INR',
    billingUnit: '15-day trial',
    validityDuration: '15 Days Trial',
    maxAttendees: 50,
    maxEvents: 1,
    badge: '15-Day Free Trial',
    description: 'Perfect for small meetups, workshops, and evaluating MS Backstage during your 15-day trial.',
    features: [
      '15-Day Full-Access Free Trial',
      'Up to 50 Attendees per Event (Hard Limit)',
      'Instant QR Check-In & Check-Out Desk',
      'Basic Badge Printing (Standard Thermal)',
      'Real-Time Attendance Overview',
      'Attendee List CSV Export',
      'Single Desk Operator',
    ],
    ctaLabel: 'Current Plan',
  },
  pro: {
    id: 'pro',
    name: 'Pro Event',
    priceInPenceOrPaise: 200000, // INR 2,000.00
    priceFormatted: '₹2,000',
    currency: 'INR',
    billingUnit: 'per event',
    validityDuration: '1 Month (30 Days)',
    maxAttendees: 1000,
    maxEvents: 5,
    popular: true,
    badge: 'Most Popular',
    extraAttendeePriceInPaise: 2000, // ₹20 per extra attendee
    description: 'Complete high-throughput operational control for medium conferences & summits. Includes all Free features.',
    features: [
      'All Free Starter Features Included',
      'Up to 1,000 Attendees Included (₹20 per extra attendee)',
      'Queue-Busting Atomic Spot Registration Desk',
      'Visual Drag-and-Drop Badge Designer Canvas',
      '10 Built-In Badge Templates (A4 & A6 Sheet Print)',
      'Multi-Format Reports (Formula-Safe Excel & PDF)',
      'Up to 5 Concurrent Staff Operators',
      'Full Audit Trail & Reprint Tracking',
    ],
    ctaLabel: 'Upgrade to Pro',
  },
  pro_max: {
    id: 'pro_max',
    name: 'Pro Max Summit',
    priceInPenceOrPaise: 500000, // INR 5,000.00 (Configurable)
    priceFormatted: '₹5,000',
    currency: 'INR',
    billingUnit: 'per event',
    validityDuration: '1 Month (30 Days)',
    maxAttendees: 5000,
    maxEvents: 20,
    badge: 'High Capacity',
    extraAttendeePriceInPaise: 2000, // ₹20 per extra attendee
    description: 'Engineered for national conventions and trade shows. Includes all Free & Pro features.',
    features: [
      'All Free Starter & Pro Event Features Included',
      'Up to 5,000 Attendees Included (₹20 per extra attendee)',
      'Unlimited High-Speed Spot Registration Desks',
      'Multi-Track Hall Scanners with Session Access Control',
      'Live Category Telemetry & Attendance Velocity Charts',
      'Batch Excel Import with Intelligent Column Mapping',
      'Priority Support & On-Ground Reliability Assurance',
      'Custom Badge Sizes & Direct Thermal Label Presets',
    ],
    ctaLabel: 'Upgrade to Pro Max',
  },
  lifetime: {
    id: 'lifetime',
    name: 'Contact Us / Custom Agreement',
    priceInPenceOrPaise: 0, // Custom commercial contract
    priceFormatted: 'Contact Us',
    currency: 'INR',
    billingUnit: 'custom agreement',
    validityDuration: 'Perpetual Licensing',
    maxAttendees: 50000,
    maxEvents: 999,
    badge: 'Custom Contract',
    description: 'Unlimited capacity, perpetual licensing, and dedicated on-site assistance.',
    features: [
      'Unlimited Attendees & Unlimited Events',
      'Dedicated Custom Tenant Domain & Branding',
      'Perpetual On-Premises or Private Cloud Deployment',
      'Unlimited Concurrent Scanner Operators',
      'Custom SLA, Dedicated Engineering & On-Site Support',
      'Direct Database Integration & Webhook Automation',
    ],
    ctaLabel: 'Contact Sales',
  },
};
