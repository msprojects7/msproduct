import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  Globe, 
  Eye, 
  Save, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  ArrowUp, 
  ArrowDown, 
  EyeOff, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Palette, 
  CheckCircle2, 
  Layout, 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  Layers, 
  Award,
  Video,
  Check
} from 'lucide-react';
import { EventWebsiteConfig, WebsiteSectionType, EventWebsiteSection } from '../../types';

export const EventWebsiteBuilderPage: React.FC = () => {
  const { currentEvent, updateEventWebsiteConfig, toggleEventPublish, navigate, addToast } = useApp();

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'sections'>('content');

  // Local working copy of the event's website config
  const [config, setConfig] = useState<EventWebsiteConfig>(() => ({
    ...currentEvent.websiteConfig,
    sections: currentEvent.websiteConfig?.sections || [
      { id: 'sec-hero', type: 'hero', title: 'Hero Banner', enabled: true, order: 1 },
      { id: 'sec-about', type: 'about', title: 'About & Highlights', enabled: true, order: 2 },
      { id: 'sec-speakers', type: 'speakers', title: 'Distinguished Speakers', enabled: true, order: 3 },
      { id: 'sec-agenda', type: 'agenda', title: 'Agenda & Sessions', enabled: true, order: 4 },
      { id: 'sec-tickets', type: 'tickets', title: 'Registration & Tickets', enabled: true, order: 5 },
      { id: 'sec-sponsors', type: 'sponsors', title: 'Partners & Sponsors', enabled: true, order: 6 },
      { id: 'sec-venue', type: 'venue', title: 'Venue & Location', enabled: true, order: 7 },
      { id: 'sec-gallery', type: 'gallery', title: 'Photo Showcase', enabled: true, order: 8 },
      { id: 'sec-faq', type: 'faq', title: 'Frequently Asked Questions', enabled: true, order: 9 }
    ]
  }));

  const themes: { id: EventWebsiteConfig['theme']; name: string; bg: string; accent: string; desc: string }[] = [
    { id: 'modern-dark', name: 'Modern Dark Glass', bg: 'bg-slate-950', accent: '#6366f1', desc: 'macOS dark glass aesthetic with subtle indigo neon glow' },
    { id: 'minimal-light', name: 'Minimal Editorial Light', bg: 'bg-white', accent: '#2563eb', desc: 'Crisp high-contrast white paper layout with bold typography' },
    { id: 'electric-indigo', name: 'Electric Indigo', bg: 'bg-indigo-950', accent: '#818cf8', desc: 'Deep cosmic violet-indigo with radiant cyber accents' },
    { id: 'emerald-executive', name: 'Emerald Executive', bg: 'bg-emerald-950', accent: '#10b981', desc: 'Prestige forest green designed for healthcare & summits' },
    { id: 'cyber-cyan', name: 'Cyber Cyan Tech', bg: 'bg-zinc-950', accent: '#06b6d4', desc: 'High-density futuristic tech layout with electric cyan highlights' }
  ];

  const handleSaveDraft = () => {
    updateEventWebsiteConfig(currentEvent.id, config);
    addToast({
      type: 'success',
      title: 'Website Draft Saved',
      message: 'All hero text, theme tokens, and section orders are stored in memory.'
    });
  };

  const handlePublish = () => {
    updateEventWebsiteConfig(currentEvent.id, { ...config, published: true, publishedAt: new Date().toISOString() });
    addToast({
      type: 'success',
      title: 'Website Published Live!',
      message: 'The public event portal is now active for delegate registrations.'
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate order indices
    const updated = newSections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setConfig(prev => ({ ...prev, sections: updated }));
  };

  const toggleSectionEnabled = (id: string) => {
    const updated = config.sections.map(sec => 
      sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
    );
    setConfig(prev => ({ ...prev, sections: updated }));
  };

  const removeSection = (id: string) => {
    const updated = config.sections.filter(sec => sec.id !== id);
    setConfig(prev => ({ ...prev, sections: updated }));
  };

  const addCustomSection = (type: WebsiteSectionType, title: string) => {
    const newSection: EventWebsiteSection = {
      id: `sec-${type}-${Date.now()}`,
      type,
      title,
      enabled: true,
      order: config.sections.length + 1
    };
    setConfig(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    addToast({ type: 'info', title: 'Section Added', message: `Added "${title}" to website layout.` });
  };

  return (
    <div className="w-full pb-20 pt-2 sm:pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div>
            <BackButton label="Back to Event Dashboard" targetRoute="events-dashboard" />
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  config.published 
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                }`}>
                  {config.published ? 'Published Live' : 'Draft Mode'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{currentEvent.slug}.msbackstage.io</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
                <Globe className="w-6 h-6 text-indigo-400" />
                <span>Event Website Builder</span>
              </h1>
              <p className="text-xs text-slate-400">
                Visual microsite designer for {currentEvent.name} · Customize branding, agenda, speakers & ticket checkout
              </p>
            </div>
          </div>

          {/* ACTIONS & VIEWPORT TOGGLES */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop / Mobile Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'desktop' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop Viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'mobile' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile Viewport"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              onClick={() => navigate('event-public')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-300 hover:text-white bg-sky-950/40 hover:bg-sky-900/60 border border-sky-700/50 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Live Site</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              onClick={handlePublish}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-950/60 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{config.published ? 'Update Live Portal' : 'Publish Website'}</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE DUAL-PANE: Left Controls & Right Live Visual Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Controls & Settings Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* TAB SELECTOR */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  activeTab === 'content' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hero & Copy
              </button>
              <button
                onClick={() => setActiveTab('sections')}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  activeTab === 'sections' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sections ({config.sections.length})
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  activeTab === 'theme' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Branding
              </button>
            </div>

            {/* TAB 1: HERO & COPYWRITING */}
            {activeTab === 'content' && (
              <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hero Section Copy</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Top of page</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Headline</label>
                  <input
                    type="text"
                    value={config.bannerHeadline}
                    onChange={(e) => setConfig({ ...config, bannerHeadline: e.target.value })}
                    placeholder="e.g. Apex Global Summit 2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subheadline / Overview</label>
                  <textarea
                    rows={3}
                    value={config.bannerSubheadline}
                    onChange={(e) => setConfig({ ...config, bannerSubheadline: e.target.value })}
                    placeholder="Short description summarizing conference value..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Call-to-Action Button Text</label>
                  <input
                    type="text"
                    value={config.ctaText}
                    onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                    placeholder="Reserve Delegate Pass"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-700/30 text-[11px] text-slate-300 space-y-1">
                  <span className="font-semibold text-indigo-400 block">Live Event Parameters</span>
                  <p>Event Dates: {new Date(currentEvent.startDate).toLocaleDateString()} – {new Date(currentEvent.endDate).toLocaleDateString()}</p>
                  <p>Venue: {currentEvent.venue} ({currentEvent.eventType} format)</p>
                  <p>Tickets: {currentEvent.tickets.length} tiers active</p>
                </div>
              </div>
            )}

            {/* TAB 2: SECTION MANAGEMENT (ADD, REMOVE, HIDE, REORDER) */}
            {activeTab === 'sections' && (
              <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Website Section Order</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Reorder & toggle</span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Organizers can show, hide, reorder, or add custom sections to tailor the microsite structure.
                </p>

                <div className="space-y-2">
                  {config.sections.map((section, idx) => (
                    <div 
                      key={section.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        section.enabled 
                          ? 'bg-slate-900/80 border-slate-800 text-slate-200' 
                          : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium truncate">{section.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, 'up')}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === config.sections.length - 1}
                          onClick={() => moveSection(idx, 'down')}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {/* Toggle visibility */}
                        <button
                          type="button"
                          onClick={() => toggleSectionEnabled(section.id)}
                          className={`p-1 rounded transition-colors ${
                            section.enabled ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={section.enabled ? 'Hide section' : 'Show section'}
                        >
                          {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        {/* Delete section */}
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 transition-colors"
                          title="Remove section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Section Quick Actions */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-2">Add Section:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => addCustomSection('gallery', 'Photo Gallery')}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-left flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" />
                      <span>Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomSection('faq', 'Event FAQ')}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-left flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" />
                      <span>FAQ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: THEME SELECTION & BRANDING */}
            {activeTab === 'theme' && (
              <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Visual Theme Preset</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">5 presets</span>
                </div>

                <div className="space-y-2.5">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setConfig({ ...config, theme: t.id, accentColor: t.accent })}
                      className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        config.theme === t.id
                          ? 'border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-950/50'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full shrink-0 mt-0.5 border border-white/20 shadow-inner flex items-center justify-center"
                        style={{ backgroundColor: t.accent }}
                      >
                        {config.theme === t.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{t.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="block font-semibold text-slate-300 mb-1">Custom Accent Hex</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={config.accentColor || '#6366f1'}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.accentColor || '#6366f1'}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Live Interactive Preview Viewport (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            
            {/* Viewport Frame Shell */}
            <div 
              className={`w-full transition-all duration-300 rounded-3xl overflow-hidden border shadow-2xl ${
                previewDevice === 'mobile' 
                  ? 'max-w-[390px] border-slate-700 shadow-indigo-950/60' 
                  : 'max-w-full border-slate-800'
              } ${
                config.theme === 'minimal-light' 
                  ? 'bg-slate-50 text-slate-900' 
                  : config.theme === 'electric-indigo'
                  ? 'bg-indigo-950 text-slate-100'
                  : config.theme === 'emerald-executive'
                  ? 'bg-emerald-950 text-slate-100'
                  : 'bg-slate-950 text-slate-100'
              }`}
              style={{ minHeight: '680px' }}
            >
              
              {/* Fake Browser / Mobile Notch Header */}
              <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="px-3 py-0.5 rounded-full bg-white/5 text-[10px] truncate max-w-[200px]">
                  https://{currentEvent.slug}.msbackstage.io
                </div>
                <div className="text-[10px] uppercase font-bold text-indigo-400">
                  {previewDevice}
                </div>
              </div>

              {/* MICROSITE CONTENT PREVIEW (SCROLLABLE CANVAS) */}
              <div className="max-h-[720px] overflow-y-auto divide-y divide-white/5">
                
                {/* 1. MICROSITE TOP NAV */}
                <div className="p-4 flex items-center justify-between backdrop-blur-md bg-black/20 sticky top-0 z-10 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {currentEvent.name.substring(0, 1)}
                    </div>
                    <span className="font-bold text-xs tracking-tight truncate max-w-[150px]">
                      {currentEvent.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium opacity-80">
                    <span className="hidden sm:inline">About</span>
                    <span className="hidden sm:inline">Speakers</span>
                    <span className="hidden sm:inline">Agenda</span>
                    <button 
                      className="px-2.5 py-1 rounded-lg text-white font-semibold text-[10px] shadow-sm"
                      style={{ backgroundColor: config.accentColor || '#6366f1' }}
                    >
                      {config.ctaText || 'Get Tickets'}
                    </button>
                  </div>
                </div>

                {/* 2. DYNAMIC ORDERED SECTIONS */}
                {config.sections.filter(s => s.enabled).map(section => {
                  
                  // HERO SECTION
                  if (section.type === 'hero') {
                    return (
                      <div key={section.id} className="p-6 sm:p-10 text-center relative overflow-hidden">
                        <div className="max-w-xl mx-auto space-y-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white/10 backdrop-blur-md border border-white/10">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{new Date(currentEvent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>·</span>
                            <MapPin className="w-3.5 h-3.5 text-sky-400" />
                            <span>{currentEvent.venue}</span>
                          </div>

                          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                            {config.bannerHeadline || currentEvent.name}
                          </h2>

                          <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                            {config.bannerSubheadline || currentEvent.description}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                            <button
                              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl transition-transform active:scale-95"
                              style={{ backgroundColor: config.accentColor || '#6366f1' }}
                            >
                              {config.ctaText || 'Reserve Ticket'}
                            </button>
                            {currentEvent.eventType !== 'In-Person' && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-medium">
                                <Video className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{currentEvent.eventType} Broadcast</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // SPEAKERS SECTION
                  if (section.type === 'speakers') {
                    return (
                      <div key={section.id} className="p-6 sm:p-8 space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-bold tracking-tight">Keynote Speakers</h3>
                          <p className="text-[11px] opacity-70">World-class visionaries leading this gathering</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {currentEvent.speakers.slice(0, 4).map(speaker => (
                            <div key={speaker.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5">
                              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                {speaker.avatarInitials || speaker.name.substring(0, 2).toUpperCase()}
                              </div>
                              <p className="font-bold text-xs truncate">{speaker.name}</p>
                              <p className="text-[10px] opacity-70 truncate">{speaker.role}</p>
                              <p className="text-[9px] font-mono opacity-50 truncate">{speaker.company}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // TICKETS SECTION
                  if (section.type === 'tickets') {
                    return (
                      <div key={section.id} className="p-6 sm:p-8 space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-bold tracking-tight">Select Pass & Registration</h3>
                          <p className="text-[11px] opacity-70">Transparent pricing with instant badge generation</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {currentEvent.tickets.map(tkt => (
                            <div 
                              key={tkt.id} 
                              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                                tkt.isPopular 
                                  ? 'bg-indigo-600/10 border-indigo-500/50 relative' 
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              {tkt.isPopular && (
                                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-600 text-white shadow-sm">
                                  Most Popular
                                </span>
                              )}
                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase opacity-60">{tkt.category}</span>
                                <h4 className="font-bold text-xs mt-0.5">{tkt.name}</h4>
                                <p className="text-xl font-mono font-extrabold mt-2">
                                  {tkt.price === 0 ? 'FREE' : `₹${tkt.price.toLocaleString()}`}
                                </p>
                                <p className="text-[10px] opacity-70 mt-1 line-clamp-2">{tkt.description}</p>
                              </div>
                              <button 
                                className="mt-4 w-full py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: config.accentColor || '#6366f1' }}
                              >
                                Select Tier
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // AGENDA SECTION
                  if (section.type === 'agenda') {
                    return (
                      <div key={section.id} className="p-6 sm:p-8 space-y-3">
                        <div className="text-center">
                          <h3 className="text-lg font-bold tracking-tight">Summit Agenda & Keynotes</h3>
                          <p className="text-[11px] opacity-70">Explore curated tracks and interactive sessions</p>
                        </div>
                        <div className="space-y-2">
                          {currentEvent.sessions.slice(0, 3).map(session => (
                            <div key={session.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">{session.track} · {session.startTime}</span>
                                <h5 className="font-bold text-xs">{session.title}</h5>
                                <p className="text-[11px] opacity-70 line-clamp-1">{session.description}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 rounded bg-white/10 shrink-0 font-mono">
                                {session.location}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // SPONSORS SECTION
                  if (section.type === 'sponsors') {
                    return (
                      <div key={section.id} className="p-6 text-center space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Supported By Industry Partners</h4>
                        <div className="flex flex-wrap items-center justify-center gap-6 opacity-75">
                          {currentEvent.sponsors.map(spn => (
                            <div key={spn.id} className="font-extrabold tracking-widest text-sm uppercase">
                              {spn.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // VENUE & LOCATION
                  if (section.type === 'venue') {
                    return (
                      <div key={section.id} className="p-6 sm:p-8 space-y-2 text-center">
                        <h3 className="text-lg font-bold">Venue & Accommodation</h3>
                        <p className="text-xs opacity-80">{currentEvent.venue} — {currentEvent.address}</p>
                        <p className="text-[11px] font-mono opacity-60">Timezone: {currentEvent.timeZone}</p>
                      </div>
                    );
                  }

                  // GENERIC FALLBACK
                  return (
                    <div key={section.id} className="p-6 text-center space-y-1">
                      <h4 className="font-bold text-xs uppercase tracking-wider">{section.title}</h4>
                      <p className="text-[11px] opacity-60">Modular interactive section configured for {currentEvent.name}</p>
                    </div>
                  );
                })}

                {/* 3. MICROSITE FOOTER */}
                <div className="p-6 bg-black/40 text-center space-y-2 border-t border-white/5 text-[11px] opacity-60">
                  <p>© 2026 {currentEvent.name}. Powered by MS BACKSTAGE Event OS.</p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
