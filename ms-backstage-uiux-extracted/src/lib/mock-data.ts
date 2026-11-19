import { Organization, EventItem, Attendee, StaffMember, AuditLogItem, ScanLogRecord, PricingPlan, UserProfile } from '../types';

export const currentUserMock: UserProfile = {
  id: 'usr-surya',
  name: 'Surya Kumar',
  email: 'suryakumar56394@gmail.com',
  role: 'Organization Owner',
  organizationId: 'org-apex',
  phone: '+91 98450 12345',
  soundEnabled: true,
  hapticEnabled: true,
  theme: 'dark'
};

export const mockOrganizations: Organization[] = [
  {
    id: 'org-apex',
    name: 'Apex Worldwide Events',
    slug: 'apex-worldwide',
    logoText: 'AW',
    plan: 'Pro Max',
    eventCount: 4,
    memberCount: 8,
    createdAt: '2025-01-15T09:00:00Z',
    contactEmail: 'organizer@apexevents.com',
    contactPhone: '+91 80 4123 9800',
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    brandColor: '#3b82f6',
    ownerName: 'Surya Kumar'
  },
  {
    id: 'org-medlife',
    name: 'MedLife Clinical Research Institute',
    slug: 'medlife-institute',
    logoText: 'ML',
    plan: 'Pro',
    eventCount: 2,
    memberCount: 4,
    createdAt: '2025-04-10T14:30:00Z',
    contactEmail: 'academic@medlife.org',
    contactPhone: '+91 22 2654 1122',
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    brandColor: '#0ea5e9',
    ownerName: 'Dr. Jane Smith'
  }
];

export const mockEvents: EventItem[] = [
  {
    id: 'evt-apex-2026',
    orgId: 'org-apex',
    name: 'Apex Global Summit 2026',
    slug: 'apex-global-summit-2026',
    description: 'The flagship annual gathering of enterprise leaders, innovators, and academic researchers exploring frontier technology and global collaboration.',
    eventType: 'Hybrid',
    virtualStreamUrl: 'https://stream.apexevents.com/live/summit-2026',
    startDate: '2026-11-18T09:00:00',
    endDate: '2026-11-20T18:00:00',
    venue: 'Convention Center, Grand Ballroom',
    address: 'Aerocity Boulevard, New Delhi, 110037',
    timeZone: 'Asia/Kolkata (IST)',
    registrationOpen: true,
    registrationCloseDate: '2026-11-17T23:59:59',
    status: 'Live',
    prefix: 'APX-',
    startingNumber: 1001,
    currentNumber: 1018,
    numberPadding: 4,
    attendeeCount: 1420,
    checkInCount: 984,
    checkOutCount: 142,
    categories: ['VIP', 'Speaker', 'Delegate', 'Faculty', 'Student', 'Exhibitor', 'Press'],
    bannerColor: '#2563eb',
    activeBadgeTemplateId: 'tpl-corporate-minimal',
    tickets: [
      {
        id: 'tkt-vip',
        name: 'Executive VIP All-Access Pass',
        category: 'VIP',
        price: 15000,
        currency: 'INR (₹)',
        inventory: 150,
        soldCount: 142,
        description: 'Priority stage seating, executive green room access, private speaker dinner, and dedicated fast-track registration counter.',
        salesStartDate: '2026-08-01T00:00:00',
        salesEndDate: '2026-11-17T23:59:59',
        isPopular: true
      },
      {
        id: 'tkt-standard',
        name: 'Conference Delegate Pass',
        category: 'Delegate',
        price: 6500,
        currency: 'INR (₹)',
        inventory: 1000,
        soldCount: 820,
        description: 'Full 3-day access to keynote presentations, breakout tech tracks, exhibition concourse, and daily networking luncheon.',
        salesStartDate: '2026-08-01T00:00:00',
        salesEndDate: '2026-11-17T23:59:59'
      },
      {
        id: 'tkt-student',
        name: 'Academic Scholar & Student Pass',
        category: 'Student',
        price: 1800,
        currency: 'INR (₹)',
        inventory: 300,
        soldCount: 290,
        description: 'Discounted access for verified university scholars, students, and research faculty with badge access.',
        salesStartDate: '2026-09-01T00:00:00',
        salesEndDate: '2026-11-15T23:59:59'
      },
      {
        id: 'tkt-virtual',
        name: 'Virtual Interactive Stream Pass',
        category: 'Delegate',
        price: 2500,
        currency: 'INR (₹)',
        inventory: 5000,
        soldCount: 1140,
        description: 'Global 4K live broadcast access with interactive Q&A submission and digital certificate of participation.',
        salesStartDate: '2026-08-01T00:00:00',
        salesEndDate: '2026-11-20T12:00:00'
      }
    ],
    formFields: [
      { id: 'f-fullname', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Dr. Jane Smith' },
      { id: 'f-email', label: 'Work Email', type: 'email', required: true, placeholder: 'name@institution.org' },
      { id: 'f-mobile', label: 'Mobile Contact', type: 'phone', required: false, placeholder: '+91 98000 00000' },
      { id: 'f-company', label: 'Company / Organization', type: 'text', required: false, placeholder: 'Apex Technologies Inc.' },
      { id: 'f-designation', label: 'Job Title / Designation', type: 'text', required: false, placeholder: 'Head of Clinical Research' },
      { id: 'f-dietary', label: 'Meal & Dietary Requirements', type: 'select', required: false, options: ['Vegetarian', 'Non-Vegetarian', 'Jain', 'Vegan', 'None'] },
      { id: 'f-waiver', label: 'I agree to the Event Photography & Attendance Terms', type: 'checkbox', required: true }
    ],
    speakers: [
      {
        id: 'spk-1',
        name: 'Dr. Jane Smith',
        role: 'Head of Clinical Research',
        company: 'NeuroSystems Global Labs',
        bio: 'Leading researcher in neural architecture and ethical AI clinical applications. Keynote speaker for Day 1 morning plenary.',
        topic: 'Frontier AI in Modern Diagnostics',
        avatarInitials: 'JS'
      },
      {
        id: 'spk-2',
        name: 'Dr. Vikram Sarabhai',
        role: 'Distinguished Aerospace Fellow',
        company: 'Aerospace & Geospatial Institute',
        bio: 'Pioneered high-resolution satellite remote sensing applications and autonomous navigation systems.',
        topic: 'The Next Decade of Autonomous Orbiters',
        avatarInitials: 'VS'
      },
      {
        id: 'spk-3',
        name: 'Kavita Patel',
        role: 'Professor of Computer Science',
        company: 'IIT Bombay',
        bio: 'Renowned expert in distributed consensus algorithms and high-throughput real-time systems.',
        topic: 'Resilient Distributed Infrastructure at Scale',
        avatarInitials: 'KP'
      },
      {
        id: 'spk-4',
        name: 'Surya Kumar',
        role: 'Managing Director & Founder',
        company: 'Apex Technologies Inc.',
        bio: 'Founder of MS Backstage and event technologist driving seamless on-site operations for international gatherings.',
        topic: 'The Operating System for Modern Gatherings',
        avatarInitials: 'SK'
      }
    ],
    sessions: [
      {
        id: 'ses-1',
        title: 'Keynote Plenary: The Next Horizon in Enterprise AI',
        description: 'Opening address examining autonomous systems, safety invariants, and scalable deployment pipelines.',
        track: 'Main Keynote Hall',
        date: '2026-11-18',
        startTime: '09:30 AM',
        endTime: '10:45 AM',
        speakerIds: ['spk-1', 'spk-4'],
        location: 'Grand Ballroom (Hall A)',
        streamUrl: 'https://stream.apexevents.com/live/keynote'
      },
      {
        id: 'ses-2',
        title: 'Breakout Session: Distributed Systems & Low-Latency Architecture',
        description: 'Hands-on architectural teardown of resilient cluster communication and turnstile synchronization.',
        track: 'Engineering Stage',
        date: '2026-11-18',
        startTime: '11:15 AM',
        endTime: '12:30 PM',
        speakerIds: ['spk-3'],
        location: 'Colloquium Hall B'
      },
      {
        id: 'ses-3',
        title: 'Fireside Chat: Autonomous Robotics & Space Infrastructure',
        description: 'A deep discussion on hardware reliability, zero-failure operations, and extreme environments.',
        track: 'Innovation Theater',
        date: '2026-11-19',
        startTime: '02:00 PM',
        endTime: '03:15 PM',
        speakerIds: ['spk-2'],
        location: 'Innovation Amphitheater'
      }
    ],
    sponsors: [
      { id: 'spn-1', name: 'Apex Technologies', tier: 'Title Sponsor', logoText: 'APEX', website: 'https://apexevents.com' },
      { id: 'spn-2', name: 'Vanguard Capital', tier: 'Platinum', logoText: 'VANGUARD', website: 'https://vanguard.com' },
      { id: 'spn-3', name: 'NeuroSystems Global', tier: 'Gold', logoText: 'NEUROSYSTEMS', website: 'https://neurosystems.org' },
      { id: 'spn-4', name: 'Infoway Systems', tier: 'Silver', logoText: 'INFOWAY', website: 'https://infoway.com' }
    ],
    websiteConfig: {
      theme: 'modern-dark',
      bannerHeadline: 'Every Event. One Seamless Backstage.',
      bannerSubheadline: 'Join over 1,400 enterprise leaders, clinical researchers, and technological visionaries at the premier global summit in New Delhi.',
      ctaText: 'Register for Tickets',
      accentColor: '#3b82f6',
      published: true,
      publishedAt: '2026-08-01T10:00:00Z',
      sections: [
        { id: 'sec-hero', type: 'hero', title: 'Main Summit Stage', enabled: true, order: 1 },
        { id: 'sec-about', type: 'about', title: 'About The Summit', subtitle: 'Three days of groundbreaking keynotes, clinical workshops, and executive networking.', enabled: true, order: 2 },
        { id: 'sec-tickets', type: 'tickets', title: 'Passes & Registration', subtitle: 'Select from VIP, In-Person Delegate, or Global Virtual streaming tiers.', enabled: true, order: 3 },
        { id: 'sec-speakers', type: 'speakers', title: 'Distinguished Keynote Speakers', subtitle: 'Learn from pioneers in clinical robotics, aerospace, and distributed infrastructure.', enabled: true, order: 4 },
        { id: 'sec-agenda', type: 'agenda', title: 'Summit Schedule & Tracks', subtitle: 'Comprehensive daily agenda across keynote halls and technical workshops.', enabled: true, order: 5 },
        { id: 'sec-venue', type: 'venue', title: 'Venue & Access Logistics', subtitle: 'Convention Center Grand Ballroom, Aerocity Boulevard, New Delhi.', enabled: true, order: 6 },
        { id: 'sec-sponsors', type: 'sponsors', title: 'Global Sponsors & Partners', subtitle: 'Supported by industry leaders advancing technological transformation.', enabled: true, order: 7 }
      ]
    }
  },
  {
    id: 'evt-med-conclave',
    orgId: 'org-medlife',
    name: 'National Healthcare Innovation Conclave',
    slug: 'national-healthcare-conclave',
    description: 'Annual medical conference on clinical protocols, surgical advancements, and ethical AI in diagnostics.',
    eventType: 'In-Person',
    startDate: '2026-12-05T08:30:00',
    endDate: '2026-12-07T17:00:00',
    venue: 'Institute of Medical Sciences Auditorium',
    address: 'Bandra-Kurla Complex, Mumbai, 400051',
    timeZone: 'Asia/Kolkata (IST)',
    registrationOpen: true,
    registrationCloseDate: '2026-12-03T23:59:59',
    status: 'Published',
    prefix: 'MDC-',
    startingNumber: 5001,
    currentNumber: 5120,
    numberPadding: 4,
    attendeeCount: 650,
    checkInCount: 0,
    checkOutCount: 0,
    categories: ['Surgeon', 'Consultant', 'Resident Doctor', 'Fellow', 'Keynote Speaker', 'Delegate'],
    bannerColor: '#0284c7',
    activeBadgeTemplateId: 'tpl-medical-conference',
    tickets: [
      {
        id: 'tkt-surgeon',
        name: 'Surgeon / Senior Consultant Pass (4 CME Credits)',
        category: 'Surgeon',
        price: 8500,
        currency: 'INR (₹)',
        inventory: 400,
        soldCount: 380,
        description: 'Includes hands-on surgical robotics workshop, CME accreditation certificate, and conference banquet.',
        salesStartDate: '2026-09-01T00:00:00',
        salesEndDate: '2026-12-03T23:59:59',
        isPopular: true
      },
      {
        id: 'tkt-resident',
        name: 'Resident Doctor & Post-Graduate Pass',
        category: 'Resident Doctor',
        price: 3200,
        currency: 'INR (₹)',
        inventory: 250,
        soldCount: 210,
        description: 'Subsidized admission for medical residents with paper presentation eligibility.',
        salesStartDate: '2026-09-01T00:00:00',
        salesEndDate: '2026-12-03T23:59:59'
      }
    ],
    formFields: [
      { id: 'f-name', label: 'Doctor Full Name', type: 'text', required: true, placeholder: 'Dr. Jane Smith' },
      { id: 'f-mci', label: 'Medical Council Registration Number (MCI/State)', type: 'text', required: true, placeholder: 'e.g. MCI-84920' },
      { id: 'f-hospital', label: 'Hospital / Clinical Institute', type: 'text', required: true, placeholder: 'Apollo / AIIMS / Fortis' },
      { id: 'f-email', label: 'Clinical Email', type: 'email', required: true, placeholder: 'doctor@hospital.org' }
    ],
    speakers: [
      {
        id: 'spk-med-1',
        name: 'Dr. Jane Smith',
        role: 'Director of Neuro-Surgery',
        company: 'NeuroSystems Global',
        bio: 'Pioneer in minimally invasive micro-surgical robotic techniques.',
        topic: 'Minimally Invasive Robotic Interventions',
        avatarInitials: 'JS'
      }
    ],
    sessions: [
      {
        id: 'ses-med-1',
        title: 'Masterclass: Surgical Robotics and Protocol Optimization',
        description: 'Live procedural walkthrough and discussion on clinical outcomes.',
        track: 'Main Auditorium',
        date: '2026-12-05',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        speakerIds: ['spk-med-1'],
        location: 'Auditorium 1'
      }
    ],
    sponsors: [
      { id: 'spn-med-1', name: 'MedLife Clinical', tier: 'Title Sponsor', logoText: 'MEDLIFE', website: 'https://medlife.org' }
    ],
    websiteConfig: {
      theme: 'emerald-executive',
      bannerHeadline: 'National Healthcare Innovation Conclave',
      bannerSubheadline: 'Three days of surgical advancements, clinical robotics, and ethical medical intelligence.',
      ctaText: 'Register for CME Credits',
      accentColor: '#0ea5e9',
      published: true,
      publishedAt: '2026-09-01T10:00:00Z',
      sections: [
        { id: 'sec-hero', type: 'hero', title: 'Healthcare Conclave Stage', enabled: true, order: 1 },
        { id: 'sec-about', type: 'about', title: 'About The Conclave', subtitle: '4 CME accreditation credits certified by State Medical Council.', enabled: true, order: 2 },
        { id: 'sec-tickets', type: 'tickets', title: 'Registration Categories', subtitle: 'Surgeon and Resident passes with accreditation certificates.', enabled: true, order: 3 },
        { id: 'sec-speakers', type: 'speakers', title: 'Faculty & Keynote Surgeons', enabled: true, order: 4 },
        { id: 'sec-venue', type: 'venue', title: 'Location & Campus Map', enabled: true, order: 5 }
      ]
    }
  },
  {
    id: 'evt-tech-frontier',
    orgId: 'org-apex',
    name: 'TechFrontier Expo & Hackathon',
    slug: 'techfrontier-expo-2026',
    description: 'Hands-on exhibition showcasing robotics, autonomous systems, and embedded hardware breakthroughs.',
    eventType: 'In-Person',
    startDate: '2027-01-22T10:00:00',
    endDate: '2027-01-24T19:00:00',
    venue: 'HITEX Exhibition Center, Hall 3',
    address: 'Madhapur, Hyderabad, 500081',
    timeZone: 'Asia/Kolkata (IST)',
    registrationOpen: false,
    registrationCloseDate: '2027-01-18T23:59:59',
    status: 'Draft',
    prefix: 'TFE-',
    startingNumber: 2001,
    currentNumber: 2001,
    numberPadding: 4,
    attendeeCount: 180,
    checkInCount: 0,
    checkOutCount: 0,
    categories: ['Hacker', 'Mentor', 'Investor', 'Exhibitor', 'Visitor'],
    bannerColor: '#4f46e5',
    activeBadgeTemplateId: 'tpl-modern-qr',
    tickets: [
      {
        id: 'tkt-hacker',
        name: 'Hackathon Builder Pass',
        category: 'Hacker',
        price: 0,
        currency: 'INR (₹)',
        inventory: 500,
        soldCount: 180,
        description: 'Free admission for accepted engineering teams with 36-hour hackathon arena access and hardware kits.',
        salesStartDate: '2026-11-01T00:00:00',
        salesEndDate: '2027-01-15T23:59:59'
      }
    ],
    formFields: [
      { id: 'f-hacker-name', label: 'Builder Full Name', type: 'text', required: true },
      { id: 'f-github', label: 'GitHub / Portfolio URL', type: 'text', required: true }
    ],
    speakers: [],
    sessions: [],
    sponsors: [],
    websiteConfig: {
      theme: 'cyber-cyan',
      bannerHeadline: 'TechFrontier Expo & Hackathon',
      bannerSubheadline: 'Build autonomous hardware, robotics, and next-gen embedded tools.',
      ctaText: 'Apply as Builder',
      accentColor: '#06b6d4',
      published: false,
      sections: [
        { id: 'sec-hero', type: 'hero', title: 'TechFrontier Stage', enabled: true, order: 1 },
        { id: 'sec-about', type: 'about', title: 'About The Hackathon', enabled: true, order: 2 },
        { id: 'sec-tickets', type: 'tickets', title: 'Builder Passes', enabled: true, order: 3 }
      ]
    }
  }
];

export const mockAttendees: Attendee[] = [
  {
    id: 'att-surya',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1001',
    fullName: 'Surya Kumar',
    category: 'VIP',
    mobile: '+91 98450 12345',
    email: 'suryakumar56394@gmail.com',
    gender: 'Male',
    company: 'Apex Technologies Inc.',
    designation: 'Managing Director & Founder',
    mealPreference: 'Vegetarian',
    paymentStatus: 'Paid',
    registrationType: 'VIP Invite',
    attendanceStatus: 'Checked In',
    checkInTime: '2026-11-18T08:42:15',
    registeredAt: '2026-10-01T10:14:00',
    qrCodeData: 'MSB:APX-1001:SURYA-KUMAR',
    badgePrinted: true,
    printCount: 2,
    notes: 'Keynote introduction at 09:30 AM'
  },
  {
    id: 'att-jane',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1002',
    fullName: 'Dr. Jane Smith',
    category: 'Speaker',
    medicalCouncilNumber: 'MCI-84920-A',
    mobile: '+1 415 555 0192',
    email: 'j.smith@neurosystems.org',
    gender: 'Female',
    company: 'NeuroSystems Global Labs',
    designation: 'Head of Clinical Research',
    mealPreference: 'Vegan',
    paymentStatus: 'Complimentary',
    registrationType: 'Pre-registered',
    attendanceStatus: 'Checked In',
    checkInTime: '2026-11-18T09:05:40',
    registeredAt: '2026-10-02T14:22:00',
    qrCodeData: 'MSB:APX-1002:JANE-SMITH',
    badgePrinted: true,
    printCount: 1,
    notes: 'Stage mic setup required'
  },
  {
    id: 'att-david',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1003',
    fullName: 'David Miller',
    category: 'Delegate',
    mobile: '+44 7700 900341',
    email: 'david.miller@vanguardfin.co.uk',
    gender: 'Male',
    company: 'Vanguard Capital Partners',
    designation: 'Senior Investment Director',
    mealPreference: 'Non-Vegetarian',
    paymentStatus: 'Paid',
    registrationType: 'Pre-registered',
    attendanceStatus: 'Not Arrived',
    registeredAt: '2026-10-05T18:10:00',
    qrCodeData: 'MSB:APX-1003:DAVID-MILLER',
    badgePrinted: false,
    printCount: 0
  },
  {
    id: 'att-kavita',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1004',
    fullName: 'Kavita Patel',
    category: 'Faculty',
    mobile: '+91 94220 88712',
    email: 'kavita.patel@iitb.ac.in',
    gender: 'Female',
    company: 'Indian Institute of Technology Bombay',
    designation: 'Professor of Computer Science',
    mealPreference: 'Vegetarian',
    paymentStatus: 'Paid',
    registrationType: 'Pre-registered',
    attendanceStatus: 'Checked In',
    checkInTime: '2026-11-18T09:18:22',
    registeredAt: '2026-10-06T11:45:00',
    qrCodeData: 'MSB:APX-1004:KAVITA-PATEL',
    badgePrinted: true,
    printCount: 1
  },
  {
    id: 'att-rahul',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1005',
    fullName: 'Rahul Verma',
    category: 'Delegate',
    mobile: '+91 98111 23456',
    email: 'rahul.verma@infoway.com',
    gender: 'Male',
    company: 'Infoway Systems Corp',
    designation: 'Chief Architect',
    mealPreference: 'Jain',
    paymentStatus: 'Paid',
    registrationType: 'On-spot',
    attendanceStatus: 'Checked In',
    checkInTime: '2026-11-18T09:32:10',
    registeredAt: '2026-11-18T09:30:00',
    qrCodeData: 'MSB:APX-1005:RAHUL-VERMA',
    badgePrinted: true,
    printCount: 1,
    notes: 'Registered at counter 2'
  },
  {
    id: 'att-ananya',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1006',
    fullName: 'Ananya Roy',
    category: 'Student',
    mobile: '+91 97480 33419',
    email: 'ananya.roy@delhiuniv.edu',
    gender: 'Female',
    company: 'Delhi University Postgraduate Center',
    designation: 'Doctoral Scholar',
    mealPreference: 'Vegetarian',
    paymentStatus: 'Paid',
    registrationType: 'Pre-registered',
    attendanceStatus: 'Not Arrived',
    registeredAt: '2026-10-12T09:12:00',
    qrCodeData: 'MSB:APX-1006:ANANYA-ROY',
    badgePrinted: false,
    printCount: 0
  },
  {
    id: 'att-vikram',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1007',
    fullName: 'Dr. Vikram Sarabhai',
    category: 'Speaker',
    medicalCouncilNumber: 'DMC-19283-X',
    mobile: '+91 98200 44556',
    email: 'vikram.s@space-consortium.in',
    gender: 'Male',
    company: 'Aerospace & Geospatial Institute',
    designation: 'Distinguished Fellow',
    mealPreference: 'Vegetarian',
    paymentStatus: 'Complimentary',
    registrationType: 'VIP Invite',
    attendanceStatus: 'Checked In',
    checkInTime: '2026-11-18T08:55:00',
    registeredAt: '2026-10-04T16:00:00',
    qrCodeData: 'MSB:APX-1007:VIKRAM-SARABHAI',
    badgePrinted: true,
    printCount: 1,
    notes: 'Keynote Speaker Hall A'
  },
  {
    id: 'att-elena',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1008',
    fullName: 'Elena Rostova',
    category: 'Exhibitor',
    mobile: '+33 6 12 34 56 78',
    email: 'elena@solarpulse.eu',
    gender: 'Female',
    company: 'SolarPulse Renewable Robotics',
    designation: 'Global Exhibitions Manager',
    mealPreference: 'None',
    paymentStatus: 'Paid',
    registrationType: 'Pre-registered',
    attendanceStatus: 'Checked In',
    checkInTime: '2026-11-18T07:45:00',
    registeredAt: '2026-10-15T13:20:00',
    qrCodeData: 'MSB:APX-1008:ELENA-ROSTOVA',
    badgePrinted: true,
    printCount: 2,
    notes: 'Exhibitor booth B-14'
  },
  {
    id: 'att-marcus',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1009',
    fullName: 'Marcus Vance',
    category: 'Press',
    mobile: '+1 212 555 0144',
    email: 'm.vance@techjournal.com',
    gender: 'Male',
    company: 'International Tech Chronicles',
    designation: 'Senior Editor',
    mealPreference: 'Non-Vegetarian',
    paymentStatus: 'Complimentary',
    registrationType: 'Pre-registered',
    attendanceStatus: 'Checked Out',
    checkInTime: '2026-11-18T08:30:00',
    checkOutTime: '2026-11-18T13:15:00',
    registeredAt: '2026-10-16T15:30:00',
    qrCodeData: 'MSB:APX-1009:MARCUS-VANCE',
    badgePrinted: true,
    printCount: 1
  },
  {
    id: 'att-priya',
    eventId: 'evt-apex-2026',
    registrationNumber: 'APX-1010',
    fullName: 'Priya Sundaram',
    category: 'Delegate',
    mobile: '+91 98840 99887',
    email: 'priya.s@chennaibio.in',
    gender: 'Female',
    company: 'BioCompute Analytics',
    designation: 'Principal Scientist',
    mealPreference: 'Vegetarian',
    paymentStatus: 'Pending',
    registrationType: 'On-spot',
    attendanceStatus: 'Not Arrived',
    registeredAt: '2026-11-18T09:40:00',
    qrCodeData: 'MSB:APX-1010:PRIYA-SUNDARAM',
    badgePrinted: false,
    printCount: 0,
    notes: 'Payment verification pending at desk'
  }
];

export const mockStaff: StaffMember[] = [
  {
    id: 'stf-1',
    orgId: 'org-apex',
    name: 'Surya Kumar',
    email: 'suryakumar56394@gmail.com',
    role: 'Organization Owner',
    status: 'Active',
    assignedEventIds: ['evt-apex-2026', 'evt-tech-frontier'],
    invitedAt: '2025-01-15T09:00:00Z',
    lastActiveAt: 'Just now',
    avatarText: 'SK'
  },
  {
    id: 'stf-2',
    orgId: 'org-apex',
    name: 'Meera Nambiar',
    email: 'meera.ops@apexevents.com',
    role: 'Event Manager',
    status: 'Active',
    assignedEventIds: ['evt-apex-2026'],
    invitedAt: '2025-03-01T10:00:00Z',
    lastActiveAt: '12m ago',
    avatarText: 'MN'
  },
  {
    id: 'stf-3',
    orgId: 'org-apex',
    name: 'Arjun Das',
    email: 'arjun.counter1@apexevents.com',
    role: 'Registration Staff',
    status: 'Active',
    assignedEventIds: ['evt-apex-2026'],
    invitedAt: '2026-11-01T08:00:00Z',
    lastActiveAt: '2m ago',
    avatarText: 'AD'
  },
  {
    id: 'stf-4',
    orgId: 'org-apex',
    name: 'Chloe Tremblay',
    email: 'chloe.scanner@apexevents.com',
    role: 'Scanner Operator',
    status: 'Active',
    assignedEventIds: ['evt-apex-2026'],
    invitedAt: '2026-11-10T14:00:00Z',
    lastActiveAt: '5m ago',
    avatarText: 'CT'
  },
  {
    id: 'stf-5',
    orgId: 'org-apex',
    name: 'Rohan Mehra',
    email: 'rohan.it@apexevents.com',
    role: 'Platform Admin',
    status: 'Active',
    assignedEventIds: ['evt-apex-2026', 'evt-tech-frontier'],
    invitedAt: '2025-02-10T11:00:00Z',
    lastActiveAt: '1h ago',
    avatarText: 'RM'
  },
  {
    id: 'stf-6',
    orgId: 'org-apex',
    name: 'Tanya Sen',
    email: 'tanya.desk@apexevents.com',
    role: 'Registration Staff',
    status: 'Invited',
    assignedEventIds: ['evt-apex-2026'],
    invitedAt: '2026-11-16T18:00:00Z',
    avatarText: 'TS'
  }
];

export const mockAuditLogs: AuditLogItem[] = [
  {
    id: 'log-01',
    orgId: 'org-apex',
    eventId: 'evt-apex-2026',
    timestamp: '2026-11-18T09:32:10Z',
    actor: 'Arjun Das',
    actorRole: 'Registration Staff',
    action: 'ON_SPOT_REGISTRATION',
    targetRecord: 'APX-1005 (Rahul Verma)',
    targetType: 'Attendee',
    details: 'Created on-spot attendee record at On-Site Terminal 2 with payment marked Paid.',
    ipAddress: '192.168.10.42'
  },
  {
    id: 'log-02',
    orgId: 'org-apex',
    eventId: 'evt-apex-2026',
    timestamp: '2026-11-18T09:18:22Z',
    actor: 'Chloe Tremblay',
    actorRole: 'Scanner Operator',
    action: 'ATTENDEE_CHECK_IN',
    targetRecord: 'APX-1004 (Kavita Patel)',
    targetType: 'CheckIn',
    details: 'Scanned QR badge successfully at South Gate entrance turnstile.',
    ipAddress: '192.168.10.88'
  },
  {
    id: 'log-03',
    orgId: 'org-apex',
    eventId: 'evt-apex-2026',
    timestamp: '2026-11-18T09:05:40Z',
    actor: 'Surya Kumar',
    actorRole: 'Organization Owner',
    action: 'BADGE_PRINTED',
    targetRecord: 'APX-1002 (Dr. Jane Smith)',
    targetType: 'Badge',
    details: 'Generated thermal badge print request (Speaker template, 4x6in).',
    ipAddress: '192.168.10.12'
  },
  {
    id: 'log-04',
    orgId: 'org-apex',
    eventId: 'evt-apex-2026',
    timestamp: '2026-11-18T08:50:00Z',
    actor: 'Meera Nambiar',
    actorRole: 'Event Manager',
    action: 'EVENT_STATUS_CHANGE',
    targetRecord: 'Apex Global Summit 2026',
    targetType: 'Event',
    details: 'Status transitioned from Published to Live. Registration desk counters synchronized.',
    ipAddress: '192.168.10.15'
  },
  {
    id: 'log-05',
    orgId: 'org-apex',
    eventId: 'evt-apex-2026',
    timestamp: '2026-11-17T16:20:00Z',
    actor: 'Surya Kumar',
    actorRole: 'Organization Owner',
    action: 'BADGE_TEMPLATE_UPDATED',
    targetRecord: 'tpl-corporate-minimal',
    targetType: 'Template',
    details: 'Updated QR position and added VIP Category banner ribbon element.',
    ipAddress: '192.168.10.12'
  },
  {
    id: 'log-06',
    orgId: 'org-apex',
    eventId: 'evt-apex-2026',
    timestamp: '2026-11-16T11:15:00Z',
    actor: 'Meera Nambiar',
    actorRole: 'Event Manager',
    action: 'BATCH_IMPORT_COMPLETED',
    targetRecord: 'pre_reg_delegates_batch_3.csv',
    targetType: 'Import',
    details: 'Successfully imported 340 pre-registered delegate rows. 0 duplicates skipped.',
    ipAddress: '192.168.10.15'
  }
];

export const mockRecentScans: ScanLogRecord[] = [
  {
    id: 'scn-1',
    eventId: 'evt-apex-2026',
    attendeeId: 'att-surya',
    attendeeName: 'Surya Kumar',
    regNumber: 'APX-1001',
    category: 'VIP',
    type: 'check-in',
    timestamp: '08:42:15 AM',
    operatorName: 'Gate 1 FastTrack (Chloe)',
    status: 'Success',
    message: 'Valid VIP badge. Welcome to Apex Global Summit!'
  },
  {
    id: 'scn-2',
    eventId: 'evt-apex-2026',
    attendeeId: 'att-jane',
    attendeeName: 'Dr. Jane Smith',
    regNumber: 'APX-1002',
    category: 'Speaker',
    type: 'check-in',
    timestamp: '09:05:40 AM',
    operatorName: 'Speaker Lounge Desk (Chloe)',
    status: 'Success',
    message: 'Valid Keynote Speaker credentials verified.'
  },
  {
    id: 'scn-3',
    eventId: 'evt-apex-2026',
    attendeeId: 'att-kavita',
    attendeeName: 'Kavita Patel',
    regNumber: 'APX-1004',
    category: 'Faculty',
    type: 'check-in',
    timestamp: '09:18:22 AM',
    operatorName: 'Main Concourse Turnstile (Chloe)',
    status: 'Success',
    message: 'Check-in confirmed.'
  },
  {
    id: 'scn-4',
    eventId: 'evt-apex-2026',
    attendeeId: 'att-marcus',
    attendeeName: 'Marcus Vance',
    regNumber: 'APX-1009',
    category: 'Press',
    type: 'check-out',
    timestamp: '01:15:20 PM',
    operatorName: 'Media Exit Gate (Chloe)',
    status: 'Success',
    message: 'Check-out recorded. Badge retained by press holder.'
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    targetAudience: 'For early-stage workshops & single community meetups',
    capacityLimit: 50,
    capacityDisplay: '50 Attendees',
    priceDisplay: '₹0',
    priceSubtext: 'Forever free for small gatherings',
    ctaText: 'Get Started Free',
    features: {
      capacity: 'Up to 50 total registered attendees',
      badges: [
        'Standard single badge designer',
        'Basic QR code generator',
        'Standard monochrome print output'
      ],
      operations: [
        'Web browser QR scanner',
        'Manual on-spot registration form',
        'Single staff operator account'
      ],
      analytics: [
        'Basic check-in count and attendance tally',
        'CSV list download'
      ]
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    targetAudience: 'For mid-size conferences, symposiums & regional summits',
    capacityLimit: 1000,
    capacityDisplay: '1,000 Attendees',
    priceDisplay: '₹2,000',
    priceSubtext: 'Configurable billing cadence (event / monthly options)',
    isPopular: true,
    ctaText: 'Choose Pro',
    features: {
      capacity: 'Up to 1,000 registered attendees',
      badges: [
        'All 10 professional designer templates',
        'High-resolution multi-badge A4 sheet layout (6-up & 8-up)',
        'Custom colors, logos, and custom fields',
        'Direct thermal & inkjet printer support'
      ],
      operations: [
        'Rapid on-spot registration desk mode',
        'Multi-station camera QR scanner with sound cues',
        'Up to 10 staff accounts with role-based access'
      ],
      analytics: [
        'Real-time check-in velocity & attendance percentage',
        'Category & payment breakdown charts',
        'Audit log trails and activity stream'
      ]
    }
  },
  {
    id: 'pro-max',
    name: 'Pro Max',
    targetAudience: 'For large corporate conventions, medical conferences & expos',
    capacityLimit: 5000,
    capacityDisplay: '5,000 Attendees',
    priceDisplay: '₹7,500',
    priceSubtext: 'Proposed starting capacity (fully configurable)',
    ctaText: 'Choose Pro Max',
    features: {
      capacity: 'Up to 5,000 registered attendees (expandable)',
      badges: [
        'Advanced badge designer with custom canvas dimensions',
        'Batch automated background queue printing',
        'Custom paper templates & crop mark calibrator',
        'VIP ribbon and color-coded lanyard presets'
      ],
      operations: [
        'Unlimited simultaneous check-in scanner stations',
        'Dedicated on-site offline sync cache mode',
        'Unlimited staff & volunteer operator accounts',
        'Custom sequential prefix & registration rules'
      ],
      analytics: [
        'Hourly peak turnstile flow analytics',
        'Instant multi-field CSV/Excel exports',
        'Full compliance audit log retention'
      ]
    }
  },
  {
    id: 'lifetime',
    name: 'Lifetime & Enterprise',
    targetAudience: 'For event management firms, universities & convention halls',
    capacityLimit: 100000,
    capacityDisplay: 'Unlimited Attendees',
    priceDisplay: 'Custom',
    priceSubtext: 'Tailored commercial agreement & dedicated SLA',
    ctaText: 'Contact Sales',
    features: {
      capacity: 'Unlimited events, organizations & attendees',
      badges: [
        'White-label badge branding & custom vector fonts',
        'Dedicated custom badge layout engineering',
        'Multi-facility high-throughput printing drivers'
      ],
      operations: [
        'Single Sign-On (SAML / Enterprise Directory)',
        'Custom hardware turnstile integration support',
        'Dedicated on-site technical standby specialist'
      ],
      analytics: [
        'Custom data warehouse synchronization',
        'Executive consolidated cross-event reports',
        'Strict HIPAA / GDPR regulatory compliance packages'
      ]
    }
  }
];
