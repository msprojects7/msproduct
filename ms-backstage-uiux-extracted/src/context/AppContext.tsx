import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Attendee, 
  EventItem, 
  Organization, 
  StaffMember, 
  AuditLogItem, 
  ScanLogRecord, 
  BadgeTemplate, 
  UserProfile, 
  UserRole, 
  ToastMessage,
  AppTheme,
  EventWebsiteConfig,
  Speaker,
  Session,
  TicketTier
} from '../types';
import { 
  currentUserMock, 
  mockOrganizations, 
  mockEvents, 
  mockAttendees, 
  mockStaff, 
  mockAuditLogs, 
  mockRecentScans 
} from '../lib/mock-data';
import { initialBadgeTemplates } from '../lib/badge-templates';

interface AppContextType {
  currentRoute: string;
  navigate: (route: string, params?: { orgId?: string; eventId?: string; attendeeId?: string }) => void;
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
  organizations: Organization[];
  currentOrg: Organization;
  setCurrentOrgId: (id: string) => void;
  createOrganization: (org: Partial<Organization>) => Organization;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  events: EventItem[];
  currentEvent: EventItem;
  setCurrentEventId: (id: string) => void;
  createEvent: (evt: Partial<EventItem>) => EventItem;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  updateEventWebsiteConfig: (eventId: string, configUpdates: Partial<EventWebsiteConfig>) => void;
  toggleEventPublish: (eventId: string) => void;
  addSpeakerToEvent: (eventId: string, speaker: Omit<Speaker, 'id'>) => void;
  deleteSpeakerFromEvent: (eventId: string, speakerId: string) => void;
  addSessionToEvent: (eventId: string, session: Omit<Session, 'id'>) => void;
  deleteSessionFromEvent: (eventId: string, sessionId: string) => void;
  addTicketToEvent: (eventId: string, ticket: Omit<TicketTier, 'id'>) => void;
  deleteTicketFromEvent: (eventId: string, ticketId: string) => void;
  attendees: Attendee[];
  addAttendee: (attData: Partial<Attendee>) => Attendee;
  updateAttendee: (id: string, updates: Partial<Attendee>) => void;
  deleteAttendee: (id: string) => void;
  currentUser: UserProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  staff: StaffMember[];
  inviteStaff: (name: string, email: string, role: UserRole, assignedEvents: string[]) => void;
  deleteStaff: (id: string) => void;
  auditLogs: AuditLogItem[];
  addAuditLog: (action: string, targetRecord: string, targetType: string, details: string) => void;
  recentScans: ScanLogRecord[];
  recordScan: (qrData: string, type: 'check-in' | 'check-out') => { success: boolean; message: string; attendee?: Attendee };
  badgeTemplates: BadgeTemplate[];
  activeBadgeTemplate: BadgeTemplate;
  setActiveBadgeTemplate: (template: BadgeTemplate) => void;
  updateActiveTemplate: (updater: (prev: BadgeTemplate) => BadgeTemplate) => void;
  saveBadgeTemplate: (template: BadgeTemplate) => void;
  selectedBadgeAttendee: Attendee;
  setSelectedBadgeAttendee: (attendee: Attendee) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null;
  openConfirm: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeConfirm: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('msb-theme');
    return (saved === 'light' ? 'light' : 'dark') as AppTheme;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations);
  const [currentOrgId, setCurrentOrgIdState] = useState<string>('org-apex');
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [currentEventId, setCurrentEventIdState] = useState<string>('evt-apex-2026');
  const [attendees, setAttendees] = useState<Attendee[]>(mockAttendees);
  const [currentUser, setCurrentUser] = useState<UserProfile>(currentUserMock);
  const [currentRole, setCurrentRoleState] = useState<UserRole>('Organization Owner');
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(mockAuditLogs);
  const [recentScans, setRecentScans] = useState<ScanLogRecord[]>(mockRecentScans);
  const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>(initialBadgeTemplates);
  const [activeBadgeTemplate, setActiveBadgeTemplate] = useState<BadgeTemplate>(initialBadgeTemplates[0]);
  const [selectedBadgeAttendee, setSelectedBadgeAttendee] = useState<Attendee>(mockAttendees[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmModal, setConfirmModal] = useState<AppContextType['confirmModal']>(null);

  // Sync theme with document class
  useEffect(() => {
    localStorage.setItem('msb-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      addToast({
        type: 'info',
        title: `${next === 'dark' ? 'Dark' : 'Light'} Mode Active`,
        message: 'Visual theme appearance updated.'
      });
      return next;
    });
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const currentOrg = organizations.find(o => o.id === currentOrgId) || organizations[0];
  const currentEvent = events.find(e => e.id === currentEventId) || events[0];

  const navigate = (route: string, params?: { orgId?: string; eventId?: string; attendeeId?: string }) => {
    if (params?.orgId) setCurrentOrgIdState(params.orgId);
    if (params?.eventId) setCurrentEventIdState(params.eventId);
    if (params?.attendeeId) {
      const found = attendees.find(a => a.id === params.attendeeId);
      if (found) setSelectedBadgeAttendee(found);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setCurrentOrgId = (id: string) => {
    setCurrentOrgIdState(id);
    const relatedEvents = events.filter(e => e.orgId === id);
    if (relatedEvents.length > 0) {
      setCurrentEventIdState(relatedEvents[0].id);
    }
  };

  const setCurrentEventId = (id: string) => {
    setCurrentEventIdState(id);
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    setCurrentUser(prev => ({ ...prev, role }));
    addToast({
      type: 'info',
      title: `Role Switched to ${role}`,
      message: 'Interface permissions have dynamically adapted to this role profile.'
    });
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id, duration: toast.duration || 4000 };
    setToasts(prev => [newToast, ...prev]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      ...opts
    });
  };

  const closeConfirm = () => {
    setConfirmModal(null);
  };

  const addAuditLog = (action: string, targetRecord: string, targetType: string, details: string) => {
    const newLog: AuditLogItem = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      orgId: currentOrgId,
      eventId: currentEventId,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      actorRole: currentRole,
      action,
      targetRecord,
      targetType,
      details,
      ipAddress: '192.168.10.44'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const createOrganization = (orgData: Partial<Organization>): Organization => {
    const newOrg: Organization = {
      id: 'org-' + Math.random().toString(36).substring(2, 8),
      name: orgData.name || 'Untitled Organization',
      slug: orgData.slug || 'untitled-org',
      logoText: orgData.name ? orgData.name.substring(0, 2).toUpperCase() : 'UO',
      plan: orgData.plan || 'Free',
      eventCount: 0,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      contactEmail: orgData.contactEmail || currentUser.email,
      contactPhone: orgData.contactPhone || '+91 90000 00000',
      timezone: orgData.timezone || 'Asia/Kolkata',
      currency: orgData.currency || 'INR (₹)',
      brandColor: orgData.brandColor || '#3b82f6',
      ownerName: currentUser.name
    };
    setOrganizations(prev => [...prev, newOrg]);
    setCurrentOrgIdState(newOrg.id);
    addAuditLog('ORGANIZATION_CREATED', newOrg.name, 'Organization', `Created organization ${newOrg.name}`);
    addToast({
      type: 'success',
      title: 'Organization Created',
      message: `${newOrg.name} has been set up successfully.`
    });
    return newOrg;
  };

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    setOrganizations(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)));
    addAuditLog('ORGANIZATION_UPDATED', updates.name || id, 'Organization', 'Updated organization settings');
    addToast({
      type: 'success',
      title: 'Organization Updated',
      message: 'Organization details have been saved.'
    });
  };

  const createEvent = (evtData: Partial<EventItem>): EventItem => {
    const newEvent: EventItem = {
      id: 'evt-' + Math.random().toString(36).substring(2, 8),
      orgId: currentOrgId,
      name: evtData.name || 'Untitled Event',
      slug: evtData.slug || 'untitled-event',
      description: evtData.description || '',
      eventType: evtData.eventType || 'In-Person',
      virtualStreamUrl: evtData.virtualStreamUrl || '',
      startDate: evtData.startDate || new Date().toISOString(),
      endDate: evtData.endDate || new Date(Date.now() + 86400000).toISOString(),
      venue: evtData.venue || 'Main Convention Hall',
      address: evtData.address || 'Central Boulevard',
      timeZone: evtData.timeZone || 'Asia/Kolkata (IST)',
      registrationOpen: evtData.registrationOpen ?? true,
      registrationCloseDate: evtData.registrationCloseDate || new Date(Date.now() + 86400000 * 5).toISOString(),
      status: evtData.status || 'Draft',
      prefix: evtData.prefix || 'REG-',
      startingNumber: evtData.startingNumber || 1001,
      currentNumber: evtData.startingNumber || 1001,
      numberPadding: evtData.numberPadding || 4,
      attendeeCount: 0,
      checkInCount: 0,
      checkOutCount: 0,
      categories: evtData.categories || ['VIP', 'Speaker', 'Delegate', 'Student'],
      bannerColor: evtData.bannerColor || '#2563eb',
      activeBadgeTemplateId: evtData.activeBadgeTemplateId || 'tpl-corporate-minimal',
      tickets: evtData.tickets || [
        {
          id: 'tkt-' + Math.random().toString(36).substring(2, 7),
          name: 'General Admission Delegate Pass',
          category: 'Delegate',
          price: 2500,
          currency: 'INR (₹)',
          inventory: 500,
          soldCount: 0,
          description: 'Full access to conference sessions, exhibition area, and coffee breaks.',
          salesStartDate: new Date().toISOString(),
          salesEndDate: evtData.endDate || new Date(Date.now() + 86400000).toISOString()
        }
      ],
      formFields: evtData.formFields || [
        { id: 'f-name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Dr. Jane Smith' },
        { id: 'f-email', label: 'Work Email', type: 'email', required: true, placeholder: 'name@institution.org' }
      ],
      speakers: evtData.speakers || [],
      sessions: evtData.sessions || [],
      sponsors: evtData.sponsors || [],
      websiteConfig: evtData.websiteConfig || {
        theme: 'modern-dark',
        bannerHeadline: evtData.name || 'Premier Gathering',
        bannerSubheadline: evtData.description || 'Welcome to our upcoming event.',
        ctaText: 'Register Now',
        accentColor: '#3b82f6',
        published: false,
        sections: [
          { id: 'sec-hero', type: 'hero', title: 'Main Stage', enabled: true, order: 1 },
          { id: 'sec-about', type: 'about', title: 'About Event', enabled: true, order: 2 },
          { id: 'sec-tickets', type: 'tickets', title: 'Tickets & Registration', enabled: true, order: 3 },
          { id: 'sec-venue', type: 'venue', title: 'Venue Location', enabled: true, order: 4 }
        ]
      }
    };
    setEvents(prev => [...prev, newEvent]);
    setOrganizations(prev => prev.map(o => o.id === currentOrgId ? { ...o, eventCount: o.eventCount + 1 } : o));
    setCurrentEventIdState(newEvent.id);
    addAuditLog('EVENT_CREATED', newEvent.name, 'Event', `Created event ${newEvent.name} (${newEvent.eventType})`);
    addToast({
      type: 'success',
      title: 'Event Created',
      message: `${newEvent.name} has been configured.`
    });
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<EventItem>) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    addAuditLog('EVENT_UPDATED', updates.name || id, 'Event', 'Updated event settings and parameters.');
    addToast({
      type: 'success',
      title: 'Event Saved',
      message: 'Event configurations updated successfully.'
    });
  };

  const updateEventWebsiteConfig = (eventId: string, configUpdates: Partial<EventWebsiteConfig>) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          websiteConfig: {
            ...e.websiteConfig,
            ...configUpdates
          }
        };
      }
      return e;
    }));
    addToast({
      type: 'success',
      title: 'Website Config Updated',
      message: 'Event portal design and section visibility saved.'
    });
  };

  const toggleEventPublish = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const nextStatus = e.status === 'Published' || e.status === 'Live' ? 'Draft' : 'Published';
        const isPublishedNow = nextStatus === 'Published';
        addToast({
          type: isPublishedNow ? 'success' : 'info',
          title: isPublishedNow ? 'Event Published!' : 'Event Moved to Draft',
          message: isPublishedNow ? 'Public registration portal is now live.' : 'Event portal is now unlisted.'
        });
        return {
          ...e,
          status: nextStatus,
          registrationOpen: isPublishedNow,
          websiteConfig: {
            ...e.websiteConfig,
            published: isPublishedNow,
            publishedAt: isPublishedNow ? new Date().toISOString() : undefined
          }
        };
      }
      return e;
    }));
  };

  const addSpeakerToEvent = (eventId: string, speakerData: Omit<Speaker, 'id'>) => {
    const newSpeaker: Speaker = {
      ...speakerData,
      id: 'spk-' + Math.random().toString(36).substring(2, 7)
    };
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      speakers: [...e.speakers, newSpeaker]
    } : e));
    addToast({ type: 'success', title: 'Speaker Added', message: `${newSpeaker.name} added to event roster.` });
  };

  const deleteSpeakerFromEvent = (eventId: string, speakerId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      speakers: e.speakers.filter(s => s.id !== speakerId)
    } : e));
    addToast({ type: 'info', title: 'Speaker Removed', message: 'Speaker deleted from event roster.' });
  };

  const addSessionToEvent = (eventId: string, sessionData: Omit<Session, 'id'>) => {
    const newSession: Session = {
      ...sessionData,
      id: 'ses-' + Math.random().toString(36).substring(2, 7)
    };
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      sessions: [...e.sessions, newSession]
    } : e));
    addToast({ type: 'success', title: 'Session Scheduled', message: `"${newSession.title}" added to agenda.` });
  };

  const deleteSessionFromEvent = (eventId: string, sessionId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      sessions: e.sessions.filter(s => s.id !== sessionId)
    } : e));
    addToast({ type: 'info', title: 'Session Removed', message: 'Session deleted from agenda.' });
  };

  const addTicketToEvent = (eventId: string, ticketData: Omit<TicketTier, 'id'>) => {
    const newTicket: TicketTier = {
      ...ticketData,
      id: 'tkt-' + Math.random().toString(36).substring(2, 7)
    };
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      tickets: [...e.tickets, newTicket]
    } : e));
    addToast({ type: 'success', title: 'Ticket Tier Created', message: `${newTicket.name} is now available.` });
  };

  const deleteTicketFromEvent = (eventId: string, ticketId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      tickets: e.tickets.filter(t => t.id !== ticketId)
    } : e));
    addToast({ type: 'info', title: 'Ticket Tier Removed', message: 'Ticket category removed.' });
  };

  const addAttendee = (attData: Partial<Attendee>): Attendee => {
    const nextSeq = currentEvent.currentNumber + 1;
    const formattedSeq = nextSeq.toString().padStart(currentEvent.numberPadding, '0');
    const registrationNumber = attData.registrationNumber || `${currentEvent.prefix}${formattedSeq}`;
    const qrData = `MSB:${registrationNumber}:${(attData.fullName || 'ATTENDEE').toUpperCase().replace(/\s+/g, '-')}`;

    const newAttendee: Attendee = {
      id: 'att-' + Math.random().toString(36).substring(2, 9),
      eventId: currentEventId,
      registrationNumber,
      fullName: attData.fullName || 'Anonymous Attendee',
      category: attData.category || currentEvent.categories[0] || 'Delegate',
      medicalCouncilNumber: attData.medicalCouncilNumber || '',
      mobile: attData.mobile || '',
      email: attData.email || '',
      gender: attData.gender || 'Prefer not to say',
      company: attData.company || '',
      designation: attData.designation || '',
      mealPreference: attData.mealPreference || 'None',
      paymentStatus: attData.paymentStatus || 'Paid',
      registrationType: attData.registrationType || 'On-spot',
      attendanceStatus: attData.attendanceStatus || 'Not Arrived',
      registeredAt: new Date().toISOString(),
      qrCodeData: qrData,
      badgePrinted: false,
      printCount: 0,
      notes: attData.notes || ''
    };

    setAttendees(prev => [newAttendee, ...prev]);
    setEvents(prev => prev.map(e => e.id === currentEventId ? {
      ...e,
      attendeeCount: e.attendeeCount + 1,
      currentNumber: nextSeq
    } : e));

    addAuditLog(
      'ATTENDEE_REGISTERED',
      `${registrationNumber} (${newAttendee.fullName})`,
      'Attendee',
      `Registered as ${newAttendee.category} via ${newAttendee.registrationType}.`
    );

    return newAttendee;
  };

  const updateAttendee = (id: string, updates: Partial<Attendee>) => {
    setAttendees(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    addAuditLog('ATTENDEE_UPDATED', id, 'Attendee', 'Updated attendee details.');
    addToast({
      type: 'success',
      title: 'Attendee Updated',
      message: 'Attendee record saved.'
    });
  };

  const deleteAttendee = (id: string) => {
    const target = attendees.find(a => a.id === id);
    setAttendees(prev => prev.filter(a => a.id !== id));
    setEvents(prev => prev.map(e => e.id === currentEventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e));
    if (target) {
      addAuditLog('ATTENDEE_DELETED', `${target.registrationNumber} (${target.fullName})`, 'Attendee', 'Removed attendee from event roster.');
    }
    addToast({
      type: 'info',
      title: 'Attendee Deleted',
      message: 'Attendee record has been removed.'
    });
  };

  const recordScan = (qrData: string, type: 'check-in' | 'check-out'): { success: boolean; message: string; attendee?: Attendee } => {
    const trimmed = qrData.trim().toUpperCase();
    
    const found = attendees.find(a => 
      a.qrCodeData.toUpperCase() === trimmed ||
      a.registrationNumber.toUpperCase() === trimmed ||
      trimmed.includes(a.registrationNumber.toUpperCase()) ||
      a.id.toUpperCase() === trimmed
    );

    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!found) {
      const failedScan: ScanLogRecord = {
        id: 'scn-' + Math.random().toString(36).substring(2, 8),
        eventId: currentEventId,
        attendeeId: 'unknown',
        attendeeName: 'Unknown Badge',
        regNumber: qrData.substring(0, 16),
        category: 'Unrecognized',
        type,
        timestamp: nowTime,
        operatorName: `${currentUser.name} (Scanner)`,
        status: 'Invalid Code',
        message: 'QR code data is not recognized in this event database.'
      };
      setRecentScans(prev => [failedScan, ...prev.slice(0, 24)]);
      return { success: false, message: 'Unrecognized QR code or invalid registration key.' };
    }

    if (type === 'check-in') {
      if (found.attendanceStatus === 'Checked In') {
        const warnScan: ScanLogRecord = {
          id: 'scn-' + Math.random().toString(36).substring(2, 8),
          eventId: currentEventId,
          attendeeId: found.id,
          attendeeName: found.fullName,
          regNumber: found.registrationNumber,
          category: found.category,
          type,
          timestamp: nowTime,
          operatorName: `${currentUser.name} (Scanner)`,
          status: 'Already Processed',
          message: `Already checked in at ${found.checkInTime || 'earlier session'}.`
        };
        setRecentScans(prev => [warnScan, ...prev.slice(0, 24)]);
        return { success: false, message: `${found.fullName} is ALREADY checked in!`, attendee: found };
      }

      const updatedTime = new Date().toISOString();
      updateAttendee(found.id, { attendanceStatus: 'Checked In', checkInTime: updatedTime });
      setEvents(prev => prev.map(e => e.id === currentEventId ? { ...e, checkInCount: e.checkInCount + 1 } : e));

      const successScan: ScanLogRecord = {
        id: 'scn-' + Math.random().toString(36).substring(2, 8),
        eventId: currentEventId,
        attendeeId: found.id,
        attendeeName: found.fullName,
        regNumber: found.registrationNumber,
        category: found.category,
        type: 'check-in',
        timestamp: nowTime,
        operatorName: `${currentUser.name} (Scanner)`,
        status: 'Success',
        message: `Welcome ${found.fullName}! Check-in recorded.`
      };
      setRecentScans(prev => [successScan, ...prev.slice(0, 24)]);
      addAuditLog('ATTENDEE_CHECK_IN', `${found.registrationNumber} (${found.fullName})`, 'CheckIn', `Scanned and checked in at station.`);
      return { success: true, message: `Access Approved: Welcome ${found.fullName} (${found.category})`, attendee: found };
    } else {
      const updatedTime = new Date().toISOString();
      updateAttendee(found.id, { attendanceStatus: 'Checked Out', checkOutTime: updatedTime });
      setEvents(prev => prev.map(e => e.id === currentEventId ? { ...e, checkOutCount: e.checkOutCount + 1 } : e));

      const checkoutScan: ScanLogRecord = {
        id: 'scn-' + Math.random().toString(36).substring(2, 8),
        eventId: currentEventId,
        attendeeId: found.id,
        attendeeName: found.fullName,
        regNumber: found.registrationNumber,
        category: found.category,
        type: 'check-out',
        timestamp: nowTime,
        operatorName: `${currentUser.name} (Scanner)`,
        status: 'Success',
        message: `Check-out recorded for ${found.fullName}.`
      };
      setRecentScans(prev => [checkoutScan, ...prev.slice(0, 24)]);
      addAuditLog('ATTENDEE_CHECK_OUT', `${found.registrationNumber} (${found.fullName})`, 'CheckOut', `Scanned and checked out.`);
      return { success: true, message: `Check-out Confirmed for ${found.fullName}`, attendee: found };
    }
  };

  const inviteStaff = (name: string, email: string, role: UserRole, assignedEvents: string[]) => {
    const newMember: StaffMember = {
      id: 'stf-' + Math.random().toString(36).substring(2, 8),
      orgId: currentOrgId,
      name,
      email,
      role,
      status: 'Invited',
      assignedEventIds: assignedEvents,
      invitedAt: new Date().toISOString(),
      avatarText: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };
    setStaff(prev => [...prev, newMember]);
    setOrganizations(prev => prev.map(o => o.id === currentOrgId ? { ...o, memberCount: o.memberCount + 1 } : o));
    addAuditLog('STAFF_INVITED', `${name} (${email})`, 'Staff', `Invited with role ${role}`);
    addToast({
      type: 'success',
      title: 'Invitation Sent',
      message: `An invitation email preview has been dispatched to ${email}.`
    });
  };

  const deleteStaff = (id: string) => {
    const target = staff.find(s => s.id === id);
    setStaff(prev => prev.filter(s => s.id !== id));
    setOrganizations(prev => prev.map(o => o.id === currentOrgId ? { ...o, memberCount: Math.max(1, o.memberCount - 1) } : o));
    if (target) {
      addAuditLog('STAFF_REMOVED', target.name, 'Staff', `Removed member from organization`);
    }
    addToast({
      type: 'info',
      title: 'Staff Member Removed',
      message: 'Access permissions revoked.'
    });
  };

  const updateActiveTemplate = (updater: (prev: BadgeTemplate) => BadgeTemplate) => {
    setActiveBadgeTemplate(prev => updater(prev));
  };

  const saveBadgeTemplate = (template: BadgeTemplate) => {
    setBadgeTemplates(prev => {
      const existing = prev.some(t => t.id === template.id);
      if (existing) {
        return prev.map(t => t.id === template.id ? template : t);
      }
      return [...prev, template];
    });
    addAuditLog('BADGE_TEMPLATE_SAVED', template.name, 'BadgeTemplate', 'Saved badge layout coordinates and design parameters.');
    addToast({
      type: 'success',
      title: 'Badge Template Saved',
      message: `"${template.name}" layout coordinates and styling have been stored.`
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        theme,
        toggleTheme,
        setTheme,
        organizations,
        currentOrg,
        setCurrentOrgId,
        createOrganization,
        updateOrganization,
        events,
        currentEvent,
        setCurrentEventId,
        createEvent,
        updateEvent,
        updateEventWebsiteConfig,
        toggleEventPublish,
        addSpeakerToEvent,
        deleteSpeakerFromEvent,
        addSessionToEvent,
        deleteSessionFromEvent,
        addTicketToEvent,
        deleteTicketFromEvent,
        attendees,
        addAttendee,
        updateAttendee,
        deleteAttendee,
        currentUser,
        currentRole,
        setCurrentRole,
        staff,
        inviteStaff,
        deleteStaff,
        auditLogs,
        addAuditLog,
        recentScans,
        recordScan,
        badgeTemplates,
        activeBadgeTemplate,
        setActiveBadgeTemplate,
        updateActiveTemplate,
        saveBadgeTemplate,
        selectedBadgeAttendee,
        setSelectedBadgeAttendee,
        toasts,
        addToast,
        removeToast,
        confirmModal,
        openConfirm,
        closeConfirm
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
