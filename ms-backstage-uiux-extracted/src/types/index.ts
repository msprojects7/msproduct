export type UserRole = 
  | 'Platform Admin'
  | 'Organization Owner'
  | 'Event Manager'
  | 'Registration Staff'
  | 'Scanner Operator';

export type AppTheme = 'dark' | 'light';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  phone?: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: AppTheme;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoText?: string;
  plan: 'Free' | 'Pro' | 'Pro Max' | 'Lifetime';
  eventCount: number;
  memberCount: number;
  createdAt: string;
  contactEmail: string;
  contactPhone: string;
  timezone: string;
  currency: string;
  brandColor: string;
  ownerName: string;
}

export type EventStatus = 'Draft' | 'Published' | 'Live' | 'Completed';
export type EventType = 'In-Person' | 'Virtual' | 'Hybrid';

export interface TicketTier {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  inventory: number;
  soldCount: number;
  description: string;
  salesStartDate: string;
  salesEndDate: string;
  isPopular?: boolean;
}

export interface RegistrationFormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  company: string;
  bio: string;
  topic?: string;
  avatarInitials?: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  track: string;
  date: string;
  startTime: string;
  endTime: string;
  speakerIds: string[];
  location: string;
  streamUrl?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: 'Title Sponsor' | 'Platinum' | 'Gold' | 'Silver' | 'Media Partner';
  website?: string;
  logoText?: string;
}

export type WebsiteSectionType = 
  | 'hero' 
  | 'about' 
  | 'speakers' 
  | 'agenda' 
  | 'tickets' 
  | 'sponsors' 
  | 'venue' 
  | 'gallery' 
  | 'faq';

export interface EventWebsiteSection {
  id: string;
  type: WebsiteSectionType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  customData?: Record<string, any>;
}

export interface EventWebsiteConfig {
  theme: 'modern-dark' | 'minimal-light' | 'electric-indigo' | 'emerald-executive' | 'cyber-cyan';
  bannerHeadline: string;
  bannerSubheadline: string;
  ctaText: string;
  accentColor: string;
  published: boolean;
  publishedAt?: string;
  sections: EventWebsiteSection[];
}

export interface EventItem {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string;
  eventType: EventType;
  virtualStreamUrl?: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  timeZone: string;
  registrationOpen: boolean;
  registrationCloseDate: string;
  status: EventStatus;
  prefix: string;
  startingNumber: number;
  currentNumber: number;
  numberPadding: number;
  attendeeCount: number;
  checkInCount: number;
  checkOutCount: number;
  categories: string[];
  bannerColor: string;
  activeBadgeTemplateId: string;
  tickets: TicketTier[];
  formFields: RegistrationFormField[];
  speakers: Speaker[];
  sessions: Session[];
  sponsors: Sponsor[];
  websiteConfig: EventWebsiteConfig;
}

export type AttendanceStatus = 'Not Arrived' | 'Checked In' | 'Checked Out';
export type PaymentStatus = 'Paid' | 'Complimentary' | 'Pending';
export type RegistrationType = 'Pre-registered' | 'On-spot' | 'VIP Invite';

export interface Attendee {
  id: string;
  eventId: string;
  registrationNumber: string;
  fullName: string;
  category: string;
  medicalCouncilNumber?: string;
  mobile?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  company?: string;
  designation?: string;
  mealPreference?: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Jain' | 'None';
  paymentStatus: PaymentStatus;
  registrationType: RegistrationType;
  attendanceStatus: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  registeredAt: string;
  qrCodeData: string;
  badgePrinted: boolean;
  printCount: number;
  notes?: string;
}

export type BadgeElementType = 
  | 'name'
  | 'regNumber'
  | 'qrCode'
  | 'eventName'
  | 'category'
  | 'company'
  | 'designation'
  | 'logo'
  | 'photo'
  | 'customText'
  | 'divider';

export interface BadgeElement {
  id: string;
  type: BadgeElementType;
  label: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  fontSize?: number; // in pt
  fontFamily?: string;
  fontWeight?: 'normal' | 'semibold' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textCase?: 'uppercase' | 'capitalize' | 'normal';
  visible: boolean;
  zIndex: number;
  customText?: string;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  widthInches: number;
  heightInches: number;
  orientation: 'portrait' | 'landscape';
  categoryTheme?: string;
  headerColor: string;
  accentColor: string;
  backgroundColor: string;
  borderStyle: string;
  elements: BadgeElement[];
}

export interface StaffMember {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Invited' | 'Suspended';
  assignedEventIds: string[];
  invitedAt: string;
  lastActiveAt?: string;
  avatarText?: string;
}

export interface AuditLogItem {
  id: string;
  orgId: string;
  eventId?: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  targetRecord: string;
  targetType: string;
  details: string;
  ipAddress: string;
}

export interface ScanLogRecord {
  id: string;
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  regNumber: string;
  category: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  operatorName: string;
  status: 'Success' | 'Already Processed' | 'Invalid Code';
  message: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  targetAudience: string;
  capacityLimit: number;
  capacityDisplay: string;
  priceDisplay: string;
  priceSubtext: string;
  isPopular?: boolean;
  ctaText: string;
  features: {
    capacity: string;
    badges: string[];
    operations: string[];
    analytics: string[];
  };
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
