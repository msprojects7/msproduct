import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Users, 
  Video, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Edit3, 
  Layers, 
  ExternalLink,
  X,
  Share2,
  Check
} from 'lucide-react';
import { TicketTier, Speaker, Session } from '../../types';

export const EventPublicWebsitePage: React.FC = () => {
  const { currentEvent, addAttendee, navigate, addToast } = useApp();

  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [activeTrack, setActiveTrack] = useState<string>('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regCategory, setRegCategory] = useState(currentEvent.categories[0] || 'Delegate');
  const [regSuccess, setRegSuccess] = useState<any>(null);

  const website = currentEvent.websiteConfig;
  const theme = website?.theme || 'modern-dark';

  // Theme styling helpers
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'minimal-light':
        return 'bg-slate-50 text-slate-900';
      case 'electric-indigo':
        return 'bg-slate-950 text-slate-100 selection:bg-indigo-500/40';
      case 'emerald-executive':
        return 'bg-[#041a14] text-slate-100 selection:bg-emerald-500/40';
      case 'cyber-cyan':
        return 'bg-[#080d14] text-slate-100 selection:bg-cyan-500/40';
      case 'modern-dark':
      default:
        return 'bg-slate-950 text-slate-100 selection:bg-indigo-500/40';
    }
  };

  const getCardClass = () => {
    if (theme === 'minimal-light') {
      return 'bg-white border border-slate-200/90 shadow-sm text-slate-900';
    }
    return 'bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-xl text-slate-100';
  };

  const handleOpenRegister = (ticket?: TicketTier) => {
    if (ticket) {
      setSelectedTicket(ticket);
      setRegCategory(ticket.category);
    }
    setIsRegisterModalOpen(true);
    setRegSuccess(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    const newAtt = addAttendee({
      fullName: regName.trim(),
      email: regEmail.trim(),
      company: regCompany.trim() || 'Attendee Org',
      designation: regDesignation.trim() || 'Delegate',
      category: regCategory,
      registrationType: 'Pre-registered',
      paymentStatus: (selectedTicket?.price || 0) > 0 ? 'Paid' : 'Complimentary'
    });

    setRegSuccess(newAtt);
    addToast({
      type: 'success',
      title: 'Registration Confirmed!',
      message: `Your badge code is ${newAtt.registrationNumber}.`
    });
  };

  const tracks = ['all', ...Array.from(new Set(currentEvent.sessions.map(s => s.track)))];

  const filteredSessions = activeTrack === 'all' 
    ? currentEvent.sessions 
    : currentEvent.sessions.filter(s => s.track === activeTrack);

  return (
    <div className={`min-h-screen w-full font-sans transition-colors duration-200 pb-20 ${getThemeWrapperClass()}`}>
      
      {/* 1. ORGANIZER CONTROL BAR */}
      <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-4 py-2 text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Organizer View:</span>
          <span>Viewing public portal for <strong>{currentEvent.name}</strong></span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-900 font-mono text-indigo-300">
            Theme: {theme}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('event-builder')}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit3 className="w-3 h-3" />
            <span>Customize in Builder</span>
          </button>
          <button
            onClick={() => navigate('events-dashboard')}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* 2. PUBLIC MICROSITE HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-opacity-80 border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-white font-bold text-xs">
              {currentEvent.name.substring(0, 1)}
            </div>
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block leading-tight">
              {currentEvent.name}
            </span>
            <span className="text-[10px] opacity-70 font-mono">
              {new Date(currentEvent.startDate).getFullYear()} Global Summit
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold opacity-85">
          <a href="#about" className="hover:opacity-100 transition-opacity">About</a>
          <a href="#speakers" className="hover:opacity-100 transition-opacity">Speakers</a>
          <a href="#agenda" className="hover:opacity-100 transition-opacity">Agenda</a>
          <a href="#tickets" className="hover:opacity-100 transition-opacity">Tickets</a>
          <a href="#venue" className="hover:opacity-100 transition-opacity">Venue</a>
          <a href="#sponsors" className="hover:opacity-100 transition-opacity">Partners</a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenRegister()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all"
            style={{ backgroundColor: website?.accentColor || '#6366f1' }}
          >
            {website?.ctaText || 'Register Now'}
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative px-4 sm:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 max-w-5xl mx-auto text-center space-y-6">
        {/* Meta badges */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-medium bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(currentEvent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(currentEvent.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5 text-sky-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{currentEvent.venue}</span>
          </div>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 uppercase tracking-wider font-bold">
            {currentEvent.eventType} Event
          </span>
        </div>

        {/* Dynamic Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
          {website?.bannerHeadline || currentEvent.name}
        </h1>

        {/* Dynamic Subtitle */}
        <p className="text-sm sm:text-lg opacity-80 max-w-2xl mx-auto leading-relaxed">
          {website?.bannerSubheadline || currentEvent.description}
        </p>

        {/* CTAs */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handleOpenRegister()}
            className="px-7 py-3 rounded-2xl text-sm font-bold text-white shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: website?.accentColor || '#6366f1' }}
          >
            <span>{website?.ctaText || 'Get Event Pass'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <a
            href="#agenda"
            className="px-5 py-3 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
          >
            Explore Keynotes & Agenda
          </a>
        </div>
      </section>

      {/* 4. KEY METRICS STRIP */}
      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-3xl text-center ${getCardClass()}`}>
            <span className="text-3xl font-extrabold font-mono text-indigo-400">1,400+</span>
            <p className="text-xs opacity-75 mt-1 font-medium">Attending Delegates</p>
          </div>
          <div className={`p-5 rounded-3xl text-center ${getCardClass()}`}>
            <span className="text-3xl font-extrabold font-mono text-sky-400">{currentEvent.speakers.length || 12}</span>
            <p className="text-xs opacity-75 mt-1 font-medium">Keynote Visionaries</p>
          </div>
          <div className={`p-5 rounded-3xl text-center ${getCardClass()}`}>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">3 Days</span>
            <p className="text-xs opacity-75 mt-1 font-medium">Breakouts & Plenaries</p>
          </div>
          <div className={`p-5 rounded-3xl text-center ${getCardClass()}`}>
            <span className="text-3xl font-extrabold font-mono text-amber-400">15+</span>
            <p className="text-xs opacity-75 mt-1 font-medium">Industry Partners</p>
          </div>
        </div>
      </section>

      {/* 5. TICKET TIERS SECTION */}
      <section id="tickets" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
            Registration Passes
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Select Your Pass & Attendance Tier
          </h2>
          <p className="text-xs sm:text-sm opacity-75 max-w-xl mx-auto">
            All passes include physical badge creation, turnkey access to networking plenaries, and digital pass verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {currentEvent.tickets.map(tkt => (
            <div 
              key={tkt.id}
              className={`p-6 rounded-3xl flex flex-col justify-between transition-all hover:scale-[1.02] ${getCardClass()} ${
                tkt.isPopular ? 'ring-2 ring-indigo-500 relative' : ''
              }`}
            >
              {tkt.isPopular && (
                <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-600 text-white shadow-md">
                  Most Popular
                </span>
              )}

              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold uppercase opacity-60 block">
                  {tkt.category}
                </span>
                <h3 className="font-bold text-base leading-snug">{tkt.name}</h3>
                
                <div className="pt-2">
                  <span className="text-3xl font-extrabold font-mono tracking-tight">
                    {tkt.price === 0 ? 'FREE' : `₹${tkt.price.toLocaleString()}`}
                  </span>
                  {tkt.price > 0 && <span className="text-xs opacity-60 ml-1">/ person</span>}
                </div>

                <p className="text-xs opacity-75 leading-relaxed pt-1">
                  {tkt.description}
                </p>

                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant digital pass & QR</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lanyard badge at desk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Keynote hall admission</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenRegister(tkt)}
                className="mt-6 w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md active:scale-95 transition-all"
                style={{ backgroundColor: website?.accentColor || '#6366f1' }}
              >
                Register for {tkt.category}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SPEAKERS SECTION */}
      <section id="speakers" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
            Speakers & Faculty
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Keynote Leaders & Researchers
          </h2>
          <p className="text-xs sm:text-sm opacity-75 max-w-xl mx-auto">
            Hear from groundbreaking minds driving frontier technology and global governance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {currentEvent.speakers.map(speaker => (
            <div 
              key={speaker.id}
              onClick={() => setSelectedSpeaker(speaker)}
              className={`p-5 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 ${getCardClass()}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 mb-3 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-lg text-white">
                  {speaker.avatarInitials || speaker.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <h4 className="font-bold text-sm tracking-tight">{speaker.name}</h4>
              <p className="text-xs text-indigo-400 font-medium mt-0.5">{speaker.role}</p>
              <p className="text-[11px] opacity-60 font-mono mt-0.5">{speaker.company}</p>
              
              {speaker.topic && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <span className="text-[10px] opacity-60 uppercase font-mono block">Topic</span>
                  <p className="text-xs font-semibold opacity-90 truncate">{speaker.topic}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. AGENDA & SESSIONS */}
      <section id="agenda" className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
            Curated Agenda
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Sessions, Tracks & Timings
          </h2>
        </div>

        {/* Track Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {tracks.map(t => (
            <button
              key={t}
              onClick={() => setActiveTrack(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTrack === t 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white/10 hover:bg-white/15 opacity-80'
              }`}
            >
              {t === 'all' ? 'All Tracks' : t}
            </button>
          ))}
        </div>

        {/* Sessions Timeline List */}
        <div className="space-y-3 pt-4">
          {filteredSessions.map(session => (
            <div 
              key={session.id}
              className={`p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${getCardClass()}`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                    {session.track}
                  </span>
                  <span className="text-xs font-mono opacity-70 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{session.startTime} – {session.endTime}</span>
                  </span>
                </div>
                <h4 className="font-bold text-sm tracking-tight mt-1">{session.title}</h4>
                <p className="text-xs opacity-75 max-w-2xl leading-relaxed">{session.description}</p>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-xl bg-white/10 text-xs font-mono opacity-85">
                  {session.location}
                </span>
                {session.streamUrl && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <Video className="w-3 h-3" />
                    <span>Live Streamed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. VENUE & SPONSORS */}
      <section id="venue" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 sm:p-8 rounded-3xl space-y-4 ${getCardClass()}`}>
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Venue & Arrival</h3>
            <p className="text-xs opacity-75 mt-1 font-mono">Physical Hall and Gate Information</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
            <p className="font-bold">{currentEvent.venue}</p>
            <p className="opacity-80">{currentEvent.address}</p>
            <p className="opacity-60 font-mono mt-1">Timezone: {currentEvent.timeZone}</p>
          </div>
          <p className="text-xs opacity-75">
            Registration desks open 90 minutes prior to first plenary. Bring digital registration key or photo ID for instantaneous badge issuance.
          </p>
        </div>

        <div id="sponsors" className={`p-6 sm:p-8 rounded-3xl space-y-4 ${getCardClass()}`}>
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Supported By</h3>
            <p className="text-xs opacity-75 mt-1 font-mono">Industry Leadership & Sponsors</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {currentEvent.sponsors.map(spn => (
              <div key={spn.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="font-extrabold text-xs uppercase tracking-wider block">{spn.name}</span>
                <span className="text-[10px] text-indigo-400 font-mono">{spn.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. PUBLIC REGISTRATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Event Registration</h3>
                <p className="text-xs text-slate-400">{currentEvent.name}</p>
              </div>
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Registration Confirmed!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your spot is reserved. Present this unique registration key at the reception desk.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center">
                  <span className="text-xs text-slate-400 block">Assigned Badge Code:</span>
                  <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
                    {regSuccess.registrationNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">Tier: {regSuccess.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      navigate('badges');
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                  >
                    View in Badge Desk
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {selectedTicket && (
                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-700/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{selectedTicket.name}</span>
                      <span className="text-[10px] text-indigo-300 block">{selectedTicket.category} Pass</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      {selectedTicket.price === 0 ? 'FREE' : `₹${selectedTicket.price.toLocaleString()}`}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Company / Institution</label>
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Apex Tech"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                    <input
                      type="text"
                      value={regDesignation}
                      onChange={(e) => setRegDesignation(e.target.value)}
                      placeholder="Director"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Attendee Category</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {currentEvent.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg active:scale-95 transition-all"
                    style={{ backgroundColor: website?.accentColor || '#6366f1' }}
                  >
                    Confirm Registration & Issue Badge Code
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 10. SPEAKER DETAIL MODAL */}
      {selectedSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-md">
                  {selectedSpeaker.avatarInitials || selectedSpeaker.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedSpeaker.name}</h3>
                  <p className="text-xs text-indigo-400">{selectedSpeaker.role} · {selectedSpeaker.company}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSpeaker(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-white uppercase text-[10px] tracking-wider block">Biography</span>
              <p>{selectedSpeaker.bio}</p>
            </div>

            {selectedSpeaker.topic && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider block">Scheduled Keynote</span>
                <p className="font-semibold text-white mt-0.5">{selectedSpeaker.topic}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
