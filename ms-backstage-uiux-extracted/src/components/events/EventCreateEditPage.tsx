import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  Calendar, 
  MapPin, 
  Hash, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Layers, 
  CreditCard, 
  Video, 
  Building2, 
  Plus, 
  Trash2, 
  Ticket, 
  Users, 
  FileText, 
  Globe, 
  Eye, 
  Clock, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { EventType, EventStatus, TicketTier, RegistrationFormField, Speaker, Session, EventWebsiteConfig } from '../../types';

export const EventCreateEditPage: React.FC = () => {
  const { createEvent, currentOrg, navigate, addToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // 1. Core Event Details & Format
  const [name, setName] = useState('Apex AI & Quantum Congress 2026');
  const [slug, setSlug] = useState('apex-ai-quantum-congress-2026');
  const [description, setDescription] = useState('Premier global symposium convening computational theorists, enterprise leaders, and quantum engineering pioneers.');
  const [eventType, setEventType] = useState<EventType>('Hybrid');
  const [virtualStreamUrl, setVirtualStreamUrl] = useState('https://stream.apexevents.com/live/quantum-2026');
  const [startDate, setStartDate] = useState('2026-12-10T09:00');
  const [endDate, setEndDate] = useState('2026-12-12T18:00');
  const [venue, setVenue] = useState('Grand Hall of Innovation, Aerocity');
  const [address, setAddress] = useState('Aerocity Tech Boulevard, New Delhi, 110037');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata (IST)');
  const [registrationOpen, setRegistrationOpen] = useState(true);

  // 2. Registration Numbering & Categories
  const [prefix, setPrefix] = useState('APX-');
  const [startingNumber, setStartingNumber] = useState(2001);
  const [numberPadding, setNumberPadding] = useState(4);
  const [categories, setCategories] = useState<string[]>(['VIP', 'Speaker', 'Delegate', 'Researcher', 'Student', 'Exhibitor']);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // 3. Ticket Categories & Inventory
  const [tickets, setTickets] = useState<TicketTier[]>([
    {
      id: 'tkt-exec',
      name: 'Executive All-Access VIP Pass',
      category: 'VIP',
      price: 18000,
      currency: 'INR (₹)',
      inventory: 200,
      soldCount: 0,
      description: 'Exclusive keynote stage seating, VIP speakers dinner, and priority badge desk.',
      salesStartDate: '2026-10-01',
      salesEndDate: '2026-12-09',
      isPopular: true
    },
    {
      id: 'tkt-standard',
      name: 'General Conference Pass',
      category: 'Delegate',
      price: 6500,
      currency: 'INR (₹)',
      inventory: 1200,
      soldCount: 0,
      description: 'Full 3-day access to general plenaries, exhibit floor, and daily networking lunch.',
      salesStartDate: '2026-10-01',
      salesEndDate: '2026-12-09'
    },
    {
      id: 'tkt-virtual',
      name: 'Virtual Global Stream Pass',
      category: 'Delegate',
      price: 0,
      currency: 'INR (₹)',
      inventory: 5000,
      soldCount: 0,
      description: 'Free live broadcast access with interactive chat and digital credentials.',
      salesStartDate: '2026-10-01',
      salesEndDate: '2026-12-12'
    }
  ]);
  const [newTicketName, setNewTicketName] = useState('');
  const [newTicketPrice, setNewTicketPrice] = useState(4500);
  const [newTicketCategory, setNewTicketCategory] = useState('Delegate');
  const [newTicketInventory, setNewTicketInventory] = useState(500);

  // 4. Registration Form Fields
  const [formFields, setFormFields] = useState<RegistrationFormField[]>([
    { id: 'f-name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Dr. Jane Smith' },
    { id: 'f-email', label: 'Institutional Email', type: 'email', required: true, placeholder: 'name@institution.org' },
    { id: 'f-phone', label: 'Mobile Number', type: 'phone', required: false, placeholder: '+91 98765 43210' },
    { id: 'f-org', label: 'Company / University', type: 'text', required: true, placeholder: 'Institute of Physics' },
    { id: 'f-role', label: 'Designation / Title', type: 'text', required: false, placeholder: 'Senior Staff Engineer' },
    { id: 'f-dietary', label: 'Dietary Preference', type: 'select', required: false, options: ['Vegetarian', 'Non-Vegetarian', 'Jain', 'Vegan'] }
  ]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<RegistrationFormField['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // 5. Speakers & Sessions
  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      id: 'spk-1',
      name: 'Dr. Jane Smith',
      role: 'Chief AI Architect',
      company: 'NeuroSystems Global',
      bio: 'Leading researcher in neuro-symbolic algorithms and safety invariants.',
      topic: 'Frontier Architectures for Quantum Systems',
      avatarInitials: 'JS'
    },
    {
      id: 'spk-2',
      name: 'Vikram Sarabhai Fellow',
      role: 'Professor of Physics',
      company: 'Quantum Dynamics Lab',
      bio: 'Specialist in superconducting qubits and low-temperature decoherence.',
      topic: 'Scaling Fault-Tolerant Quantum Nodes',
      avatarInitials: 'VS'
    }
  ]);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerRole, setNewSpeakerRole] = useState('');
  const [newSpeakerCompany, setNewSpeakerCompany] = useState('');
  const [newSpeakerTopic, setNewSpeakerTopic] = useState('');

  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'ses-1',
      title: 'Opening Plenary: The Frontiers of Quantum Intelligence',
      description: 'Keynote opening overview of quantum computing and neural systems.',
      track: 'Main Keynote Stage',
      date: '2026-12-10',
      startTime: '09:30 AM',
      endTime: '11:00 AM',
      speakerIds: ['spk-1'],
      location: 'Grand Innovation Hall'
    }
  ]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionTrack, setNewSessionTrack] = useState('Engineering Track');
  const [newSessionStart, setNewSessionStart] = useState('11:30 AM');
  const [newSessionEnd, setNewSessionEnd] = useState('01:00 PM');
  const [newSessionLocation, setNewSessionLocation] = useState('Auditorium B');

  // 6. Website Customization
  const [websiteTheme, setWebsiteTheme] = useState<EventWebsiteConfig['theme']>('modern-dark');
  const [bannerHeadline, setBannerHeadline] = useState('Every Event. One Seamless Backstage.');
  const [bannerSubheadline, setBannerSubheadline] = useState('Join 1,200 delegates, researchers and industry leaders in New Delhi.');
  const [accentColor, setAccentColor] = useState('#6366f1');

  // 7. Event State
  const [eventStatus, setEventStatus] = useState<EventStatus>('Published');

  // Registration prefix dynamic derivation
  const previewRegCode = `${prefix}${(startingNumber).toString().padStart(numberPadding, '0')}`;

  const steps = [
    { num: 1, title: 'Basics & Modality' },
    { num: 2, title: 'Numbering & Tiers' },
    { num: 3, title: 'Tickets & Pricing' },
    { num: 4, title: 'Registration Form' },
    { num: 5, title: 'Speakers & Agenda' },
    { num: 6, title: 'Website Branding' },
    { num: 7, title: 'Review & Publish' }
  ];

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    if (!categories.includes(newCategoryInput.trim())) {
      setCategories([...categories, newCategoryInput.trim()]);
    }
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length > 1) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const handleAddTicket = () => {
    if (!newTicketName.trim()) return;
    const newTkt: TicketTier = {
      id: 'tkt-' + Date.now(),
      name: newTicketName.trim(),
      category: newTicketCategory,
      price: newTicketPrice,
      currency: 'INR (₹)',
      inventory: newTicketInventory,
      soldCount: 0,
      description: `Admission tier for ${newTicketCategory} participants.`,
      salesStartDate: startDate.split('T')[0],
      salesEndDate: endDate.split('T')[0]
    };
    setTickets([...tickets, newTkt]);
    setNewTicketName('');
  };

  const handleRemoveTicket = (id: string) => {
    if (tickets.length > 1) {
      setTickets(tickets.filter(t => t.id !== id));
    }
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const newFld: RegistrationFormField = {
      id: 'fld-' + Date.now(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      placeholder: `Enter ${newFieldLabel.toLowerCase()}...`
    };
    setFormFields([...formFields, newFld]);
    setNewFieldLabel('');
    setNewFieldRequired(false);
  };

  const handleRemoveField = (id: string) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const handleAddSpeaker = () => {
    if (!newSpeakerName.trim()) return;
    const newSpk: Speaker = {
      id: 'spk-' + Date.now(),
      name: newSpeakerName.trim(),
      role: newSpeakerRole.trim() || 'Speaker',
      company: newSpeakerCompany.trim() || 'Host Institution',
      bio: 'Distinguished speaker presenting groundbreaking work in this symposium track.',
      topic: newSpeakerTopic.trim() || 'Keynote Presentation',
      avatarInitials: newSpeakerName.trim().substring(0, 2).toUpperCase()
    };
    setSpeakers([...speakers, newSpk]);
    setNewSpeakerName('');
    setNewSpeakerRole('');
    setNewSpeakerCompany('');
    setNewSpeakerTopic('');
  };

  const handleRemoveSpeaker = (id: string) => {
    setSpeakers(speakers.filter(s => s.id !== id));
  };

  const handleAddSession = () => {
    if (!newSessionTitle.trim()) return;
    const newSes: Session = {
      id: 'ses-' + Date.now(),
      title: newSessionTitle.trim(),
      description: 'Scheduled conference presentation and interactive discussion session.',
      track: newSessionTrack,
      date: startDate.split('T')[0],
      startTime: newSessionStart,
      endTime: newSessionEnd,
      speakerIds: speakers.map(s => s.id).slice(0, 1),
      location: newSessionLocation
    };
    setSessions([...sessions, newSes]);
    setNewSessionTitle('');
  };

  const handleRemoveSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleFinalSubmit = (statusToSet: EventStatus = eventStatus) => {
    if (!name.trim()) {
      addToast({ type: 'error', title: 'Name Required', message: 'Please enter an event name.' });
      setCurrentStep(1);
      return;
    }

    const created = createEvent({
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      eventType,
      virtualStreamUrl: eventType !== 'In-Person' ? virtualStreamUrl : undefined,
      startDate,
      endDate,
      venue: venue.trim() || 'Grand Convention Hall',
      address: address.trim() || 'Central Boulevard',
      timeZone,
      registrationOpen,
      prefix: prefix.trim() || 'EVT-',
      startingNumber,
      numberPadding,
      categories,
      tickets,
      formFields,
      speakers,
      sessions,
      status: statusToSet,
      websiteConfig: {
        theme: websiteTheme,
        bannerHeadline: bannerHeadline || name,
        bannerSubheadline,
        ctaText: 'Register Now',
        accentColor,
        published: statusToSet === 'Published' || statusToSet === 'Live',
        sections: [
          { id: 'sec-hero', type: 'hero', title: 'Hero Banner', enabled: true, order: 1 },
          { id: 'sec-about', type: 'about', title: 'About & Highlights', enabled: true, order: 2 },
          { id: 'sec-speakers', type: 'speakers', title: 'Distinguished Speakers', enabled: true, order: 3 },
          { id: 'sec-agenda', type: 'agenda', title: 'Agenda & Sessions', enabled: true, order: 4 },
          { id: 'sec-tickets', type: 'tickets', title: 'Tickets & Registration', enabled: true, order: 5 },
          { id: 'sec-venue', type: 'venue', title: 'Venue & Location', enabled: true, order: 6 },
          { id: 'sec-sponsors', type: 'sponsors', title: 'Partners & Sponsors', enabled: true, order: 7 }
        ]
      }
    });

    addToast({
      type: 'success',
      title: `Event ${statusToSet === 'Draft' ? 'Draft Saved' : 'Published Successfully'}`,
      message: `"${created.name}" is now accessible in the workspace.`
    });

    navigate('events-dashboard');
  };

  return (
    <div className="w-full pb-20 pt-2 sm:pt-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div>
            <BackButton label="Back to Events List" targetRoute="events-list" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <span>Guided Event Creation Wizard</span>
              </h1>
              <p className="text-xs text-slate-400">
                Setup your complete event workspace: physical & virtual venues, sequential tickets, custom forms, speakers, and public website.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFinalSubmit('Draft')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleFinalSubmit('Published')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-950/60 active:scale-95 transition-all"
            >
              Publish Event Now
            </button>
          </div>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="p-3 rounded-2xl glass-panel border border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {steps.map((st) => {
              const isActive = currentStep === st.num;
              const isPast = currentStep > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setCurrentStep(st.num)}
                  className={`flex-1 flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : isPast
                      ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    isActive ? 'bg-white text-indigo-900 font-bold' : isPast ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPast ? <Check className="w-3 h-3" /> : st.num}
                  </span>
                  <span className="truncate">{st.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl">
          
          {/* STEP 1: BASICS & EVENT MODALITY */}
          {currentStep === 1 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">Step 1: Event Identification & Format</h3>
                <p className="text-slate-400 text-xs">Configure your event title, format (In-person, Virtual, or Hybrid), dates, and venue.</p>
              </div>

              {/* Event Type / Modality Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-2">Event Modality / Format *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'In-Person' as EventType, label: 'In-Person Physical', icon: Building2, desc: 'On-site venue with physical badge turnstiles' },
                    { type: 'Virtual' as EventType, label: 'Virtual Live Stream', icon: Video, desc: 'Remote attendee broadcast with digital pass' },
                    { type: 'Hybrid' as EventType, label: 'Hybrid (Both)', icon: Globe, desc: 'Both on-site physical halls and online streams' }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setEventType(item.type)}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                          eventType === item.type
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${eventType === item.type ? 'text-indigo-400' : 'text-slate-400'}`} />
                          {eventType === item.type && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{item.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    placeholder="e.g. Apex Global Summit 2026"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Portal URL Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="apex-global-summit-2026"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Executive Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of conference themes, keynote agendas, and delegates..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Timezone *</label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST +5:30)</option>
                    <option value="America/New_York (EST)">America/New_York (EST -5:00)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT +0:00)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST +4:00)</option>
                    <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT +8:00)</option>
                  </select>
                </div>
              </div>

              {/* Physical Venue (for In-Person & Hybrid) */}
              {eventType !== 'Virtual' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Physical Venue / Facility *</label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Grand Convention Center, Hall A"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Street Address / City *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Aerocity Boulevard, New Delhi, 110037"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Virtual Broadcast URL (for Virtual & Hybrid) */}
              {eventType !== 'In-Person' && (
                <div className="pt-2">
                  <label className="block font-semibold text-slate-300 mb-1">Live Broadcast / Webcast URL</label>
                  <input
                    type="url"
                    value={virtualStreamUrl}
                    onChange={(e) => setVirtualStreamUrl(e.target.value)}
                    placeholder="https://stream.apexevents.com/live/keynote"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">Attendees with virtual passes will access this stream directly from their pass confirmation.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: NUMBERING & TIERS */}
          {currentStep === 2 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">Step 2: Sequential Registration Numbering & Categories</h3>
                <p className="text-slate-400 text-xs">Configure the prefix and zero-padding for unique badge numbers, and manage delegate categories.</p>
              </div>

              {/* Numbering Rules Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
                <span className="font-semibold text-indigo-300 block uppercase tracking-wider text-[11px]">
                  Sequential Key Generator Rules
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Code Prefix *</label>
                    <input
                      type="text"
                      required
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                      placeholder="e.g. APX-"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Starting Number *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={startingNumber}
                      onChange={(e) => setStartingNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Zero Padding Length</label>
                    <select
                      value={numberPadding}
                      onChange={(e) => setNumberPadding(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value={3}>3 digits (e.g. 001)</option>
                      <option value={4}>4 digits (e.g. 1001)</option>
                      <option value={5}>5 digits (e.g. 01001)</option>
                      <option value={6}>6 digits (e.g. 001001)</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Dynamic Derived Key */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block text-[11px]">Real-time Next Key Output:</span>
                    <span className="text-xs text-slate-500">Atomic counter preview for walk-in spot registration</span>
                  </div>
                  <span className="font-mono text-lg font-extrabold text-indigo-400 bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-800/50">
                    {previewRegCode}
                  </span>
                </div>
              </div>

              {/* Delegate Tier Categories */}
              <div className="space-y-3">
                <label className="block font-semibold text-slate-300">Delegate Categories & Security Badges</label>
                
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <span 
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove category"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 max-w-sm">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Add category (e.g. Media / Press)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }}}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TICKETS & PRICING */}
          {currentStep === 3 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">Step 3: Ticket Categories, Prices & Inventory</h3>
                <p className="text-slate-400 text-xs">Define tickets, capacities, pricing (free ₹0 or paid), and sales windows.</p>
              </div>

              {/* Ticket Cards List */}
              <div className="space-y-3">
                {tickets.map(tkt => (
                  <div key={tkt.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                          {tkt.category}
                        </span>
                        <h4 className="font-bold text-white text-sm">{tkt.name}</h4>
                        {tkt.isPopular && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">Popular</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">{tkt.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <span className="font-mono text-base font-extrabold text-white">
                          {tkt.price === 0 ? 'FREE' : `₹${tkt.price.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">Limit: {tkt.inventory} passes</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTicket(tkt.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40"
                        title="Remove ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Ticket Quick Form */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
                  Add New Ticket Category
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Ticket Name</label>
                    <input
                      type="text"
                      value={newTicketName}
                      onChange={(e) => setNewTicketName(e.target.value)}
                      placeholder="e.g. Student Scholar Pass"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Category</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Price (₹ INR, 0 for free)</label>
                    <input
                      type="number"
                      min="0"
                      value={newTicketPrice}
                      onChange={(e) => setNewTicketPrice(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Inventory Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={newTicketInventory}
                      onChange={(e) => setNewTicketInventory(parseInt(e.target.value, 10) || 100)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddTicket}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ticket Tier</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REGISTRATION FORM CONFIGURATION */}
          {currentStep === 4 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">Step 4: Registration Form Configuration</h3>
                <p className="text-slate-400 text-xs">Configure the fields captured during online and on-spot registrations.</p>
              </div>

              <div className="space-y-2">
                {formFields.map((fld, idx) => (
                  <div key={fld.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white">{fld.label}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>Type: {fld.type}</span>
                          {fld.required && <span className="text-amber-400 font-bold">*Required</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(fld.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Field */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
                  Add Registration Field
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Field Label</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g. Medical Council Number"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Input Type</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    >
                      <option value="text">Single-line Text</option>
                      <option value="email">Email Address</option>
                      <option value="phone">Phone / Mobile</option>
                      <option value="select">Dropdown Select</option>
                      <option value="checkbox">Checkbox Confirmation</option>
                      <option value="textarea">Multi-line Text</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                      />
                      <span>Mandatory / Required Field</span>
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Question Field</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SPEAKERS & AGENDA */}
          {currentStep === 5 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">Step 5: Speakers & Agenda Sessions</h3>
                <p className="text-slate-400 text-xs">Organize plenary keynotes, breakout tracks, and faculty assignments.</p>
              </div>

              {/* Speakers List */}
              <div className="space-y-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
                  Keynote Speakers ({speakers.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {speakers.map(spk => (
                    <div key={spk.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <h5 className="font-bold text-white text-xs">{spk.name}</h5>
                        <p className="text-indigo-400 text-[11px] font-medium">{spk.role} · {spk.company}</p>
                        <p className="text-slate-400 text-[10px] mt-1 font-mono">Topic: {spk.topic}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpeaker(spk.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Speaker Quick Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300 block">Add Speaker</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newSpeakerName}
                      onChange={(e) => setNewSpeakerName(e.target.value)}
                      placeholder="Speaker Name"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newSpeakerRole}
                      onChange={(e) => setNewSpeakerRole(e.target.value)}
                      placeholder="Title / Role"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newSpeakerCompany}
                      onChange={(e) => setNewSpeakerCompany(e.target.value)}
                      placeholder="Organization"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newSpeakerTopic}
                      onChange={(e) => setNewSpeakerTopic(e.target.value)}
                      placeholder="Keynote Topic"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpeaker}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Speaker</span>
                  </button>
                </div>
              </div>

              {/* Sessions List */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
                  Agenda Sessions ({sessions.length})
                </span>
                <div className="space-y-2">
                  {sessions.map(ses => (
                    <div key={ses.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-950 text-indigo-300">
                            {ses.track}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{ses.startTime} – {ses.endTime}</span>
                        </div>
                        <h5 className="font-bold text-white text-xs mt-0.5">{ses.title}</h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(ses.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Session */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300 block">Add Agenda Session</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      placeholder="Session Title"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs sm:col-span-3"
                    />
                    <input
                      type="text"
                      value={newSessionTrack}
                      onChange={(e) => setNewSessionTrack(e.target.value)}
                      placeholder="Track (e.g. Keynote Hall)"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newSessionStart}
                      onChange={(e) => setNewSessionStart(e.target.value)}
                      placeholder="Start Time (e.g. 10:00 AM)"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newSessionLocation}
                      onChange={(e) => setNewSessionLocation(e.target.value)}
                      placeholder="Location / Hall"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSession}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: WEBSITE BRANDING */}
          {currentStep === 6 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white tracking-tight">Step 6: Event Website & Branding Customization</h3>
                <p className="text-slate-400 text-xs">Pick a visual theme preset and customize the hero text for your public portal.</p>
              </div>

              {/* Theme Presets */}
              <div>
                <label className="block font-semibold text-slate-300 mb-2">Microsite Theme Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'modern-dark' as const, name: 'Modern Dark Glass', accent: '#6366f1' },
                    { id: 'minimal-light' as const, name: 'Minimal Editorial Light', accent: '#2563eb' },
                    { id: 'electric-indigo' as const, name: 'Electric Indigo', accent: '#818cf8' },
                    { id: 'emerald-executive' as const, name: 'Emerald Executive', accent: '#10b981' },
                    { id: 'cyber-cyan' as const, name: 'Cyber Cyan Tech', accent: '#06b6d4' }
                  ].map(thm => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => { setWebsiteTheme(thm.id); setAccentColor(thm.accent); }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        websiteTheme === thm.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: thm.accent }} />
                      <span className="truncate">{thm.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Hero Banner Headline</label>
                <input
                  type="text"
                  value={bannerHeadline}
                  onChange={(e) => setBannerHeadline(e.target.value)}
                  placeholder="e.g. The Premier Gathering for Frontier Technology"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Hero Subheadline</label>
                <textarea
                  rows={2}
                  value={bannerSubheadline}
                  onChange={(e) => setBannerSubheadline(e.target.value)}
                  placeholder="Supporting message displayed prominently under headline..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW & PUBLISH */}
          {currentStep === 7 && (
            <div className="space-y-6 text-xs animate-in fade-in">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Step 7: Final Review & Publication State</h3>
                  <p className="text-slate-400 text-xs">Verify your event configuration before activating registrations.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                    className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs"
                  >
                    <option value="Draft">Draft (Private)</option>
                    <option value="Published">Published (Public)</option>
                    <option value="Live">Live (In Progress)</option>
                  </select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] block">Event Profile</span>
                  <p className="font-bold text-white text-sm">{name}</p>
                  <p className="text-slate-400 text-[11px]">{description}</p>
                  <p className="text-slate-300 font-mono text-[11px]">Format: {eventType} · {timeZone}</p>
                  {eventType !== 'Virtual' && <p className="text-slate-300 text-[11px]">Venue: {venue}</p>}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] block">Sequential Numbering</span>
                  <p className="font-mono text-xl font-extrabold text-indigo-400">{previewRegCode}</p>
                  <p className="text-slate-400 text-[11px]">Prefix: {prefix} · Starting at: {startingNumber}</p>
                  <p className="text-slate-300 text-[11px]">Categories: {categories.join(', ')}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] block">Tickets & Capacity</span>
                  <p className="font-bold text-white">{tickets.length} Ticket Tiers Active</p>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    {tickets.map(t => (
                      <div key={t.id} className="flex justify-between">
                        <span>{t.name}</span>
                        <span className="font-mono font-bold">{t.price === 0 ? 'FREE' : `₹${t.price}`}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] block">Website & Content</span>
                  <p className="text-slate-300">Theme: <strong className="text-white capitalize">{websiteTheme}</strong></p>
                  <p className="text-slate-300">Speakers: <strong className="text-white">{speakers.length}</strong> configured</p>
                  <p className="text-slate-300">Agenda Sessions: <strong className="text-white">{sessions.length}</strong> planned</p>
                  <p className="text-slate-300">Form Questions: <strong className="text-white">{formFields.length}</strong> fields</p>
                </div>
              </div>

              {/* Status Action Cards */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Ready to Launch Event Workspace?</h4>
                    <p className="text-slate-300 text-[11px]">
                      Publishing generates the sequential counter sequence, badge templates, and public portal.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit('Draft')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700"
                  >
                    Keep as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit('Published')}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/80"
                  >
                    Publish Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEPPER NAVIGATION FOOTER */}
          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl font-medium text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            <span className="text-[11px] font-mono text-slate-500">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                className="px-5 py-2 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSubmit('Published')}
                className="px-6 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Complete & Publish</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
