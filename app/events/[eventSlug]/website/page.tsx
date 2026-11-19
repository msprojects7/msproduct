'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import BackButton from '@/app/components/ui/BackButton';
import {
  Globe,
  Palette,
  Eye,
  Save,
  Layers,
  Type,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  Menu,
  Check,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Copy,
  LayoutTemplate,
  FileText,
  Home,
  Upload,
  ZoomIn,
  ZoomOut,
  Sliders,
  Ticket,
  Users,
  Clock,
  Calendar,
  MapPin,
  HelpCircle,
  Timer,
  LayoutGrid,
  Award,
  Undo,
  Redo,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldCheck,
  Phone,
  Mail,
  Share2,
  Move,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { WEBSITE_TEMPLATES, WebsiteTemplatePreset } from '@/lib/website/templates';
import {
  WebsiteElement,
  CustomSectionItem,
  WebsiteAsset,
  WebsitePageItem,
  WebsiteThemeConfig,
  WebsiteConfig,
  WEBSITE_FONTS,
  getFontFamilyCss,
  createDefaultElementsForCustomSection,
} from '@/lib/website/config';
import VisualElementCanvas from '@/app/components/website/VisualElementCanvas';
import ElementPropertiesPanel from '@/app/components/website/ElementPropertiesPanel';

const DEFAULT_PAGES: WebsitePageItem[] = [
  { id: 'p_home', slug: '', title: 'Home / Overview', navLabel: 'Overview', isHome: true, isPublished: true, navOrder: 0, sections: ['hero', 'about', 'tickets', 'speakers', 'agenda', 'sponsors', 'contact'] },
  { id: 'p_about', slug: 'about', title: 'About Event', navLabel: 'About', isHome: false, isPublished: true, navOrder: 1, sections: ['about', 'sponsors', 'contact'], customHeadline: 'Pioneering Ideas, Global Perspectives', customDescription: 'Learn about our mission, founding committee, and keynote pillars.' },
  { id: 'p_speakers', slug: 'speakers', title: 'Featured Speakers', navLabel: 'Speakers', isHome: false, isPublished: true, navOrder: 2, sections: ['speakers', 'contact'], customHeadline: 'World-Class Visionaries & Domain Specialists', customDescription: 'Discover the distinguished luminaries leading discussions, masterclasses, and panels.' },
  { id: 'p_agenda', slug: 'agenda', title: 'Schedule & Sessions', navLabel: 'Schedule', isHome: false, isPublished: true, navOrder: 3, sections: ['agenda', 'contact'], customHeadline: 'Multi-Track Comprehensive Program', customDescription: 'Plan your itinerary across technical keynotes, workshops, and breakout sessions.' },
  { id: 'p_tickets', slug: 'tickets', title: 'Passes & Registration', navLabel: 'Tickets', isHome: false, isPublished: true, navOrder: 4, sections: ['tickets', 'contact'], customHeadline: 'Reserve Your Official Access Pass', customDescription: 'Flexible ticket classes, group discounts, and exclusive networking passes.' },
  { id: 'p_venue', slug: 'venue', title: 'Venue & Access', navLabel: 'Venue', isHome: false, isPublished: true, navOrder: 5, sections: ['contact', 'exhibitors'], customHeadline: 'Arrival & Accommodations', customDescription: 'Complete venue coordinates, airport transport, parking, and lodging recommendations.' },
];

const STOCK_LIBRARY = [
  { category: 'college', title: 'University Techfest & Hackathon Delegates', subtitle: 'Young college students collaborating on laptops', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80', tag: 'Students & College' },
  { category: 'school', title: 'School STEM Fair & Annual Day Hall', subtitle: 'Students and parents gathered for science exhibition', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&auto=format&fit=crop&q=80', tag: 'School & Youth' },
  { category: 'medical', title: 'Medical Congress & Clinical Auditorium', subtitle: 'Physicians and surgeons reviewing clinical presentations', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&auto=format&fit=crop&q=80', tag: 'Medical & Healthcare' },
  { category: 'conference', title: 'Global Summit Grand Auditorium', subtitle: 'Large plenary hall with tiered stage and ambient lighting', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80', tag: 'Flagship & Tech' },
  { category: 'tech', title: 'CloudOps & Developer Hackathon Arena', subtitle: 'Engineers building distributed software with multi-monitors', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80', tag: 'Tech & Developers' },
  { category: 'business', title: 'Executive CXO Boardroom & Plenary Forum', subtitle: 'Senior executives and ministers in keynote hall', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&auto=format&fit=crop&q=80', tag: 'Business & CXO' },
  { category: 'startup', title: 'VentureScale Founder Pitch Stage', subtitle: 'Startup founder presenting to angel investors and venture funds', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1600&auto=format&fit=crop&q=80', tag: 'Startups & Pitch' },
  { category: 'arts', title: 'DesignFuture Visual Arts & Sound Festival', subtitle: 'Dynamic stage lighting and immersive art installation', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80', tag: 'Arts & Culture' },
  { category: 'robotics', title: 'Robotics & Autonomous Hardware Expo', subtitle: 'Humanoid robot prototype and automation engineering stage', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&auto=format&fit=crop&q=80', tag: 'AI & Robotics' },
  { category: 'charity', title: 'HopeGives Non-Profit Foundation Gala Dinner', subtitle: 'Elegant black-tie ballroom setting for philanthropic patrons', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1600&auto=format&fit=crop&q=80', tag: 'Charity & Gala' },
];

export default function WebsiteStudioPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tool Drawer
  const [activeTool, setActiveTool] = useState<'templates' | 'elements' | 'pages' | 'assets' | 'design' | 'layers' | 'seo' | null>('templates');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Unified Element & Entity Selection State
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'canvas' | 'header' | 'hero' | 'section' | 'footer' | 'element';
    id?: string; // section id if section or element
    elementId?: string; // element id if element
  }>({ type: 'hero' });

  // Main Website Configuration
  const [config, setConfig] = useState<WebsiteConfig>({
    isPublished: true,
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#4f46e5',
      accentColor: '#06b6d4',
      darkMode: false,
      templateId: 'tpl_flagship_summit',
      fontFamily: 'plus_jakarta',
      heroLayout: 'split',
      cardStyle: 'bordered',
    },
    heroTitle: 'Event Summit 2026',
    heroSubtitle: 'Join international delegates, keynote speakers, and industry pioneers for our annual conference.',
    heroCoverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
    logoUrl: '',
    aboutText: 'This premier gathering convenes world-class researchers, technologists, and leaders to explore breakthrough innovations.',
    sectionsConfig: [
      { id: 'about', title: 'About Event', isVisible: true, displayOrder: 0 },
      { id: 'tickets', title: 'Passes & Registration', isVisible: true, displayOrder: 1 },
      { id: 'speakers', title: 'Keynote Speakers', isVisible: true, displayOrder: 2 },
      { id: 'agenda', title: 'Program Agenda', isVisible: true, displayOrder: 3 },
      { id: 'sponsors', title: 'Sponsors & Partners', isVisible: true, displayOrder: 4 },
      { id: 'contact', title: 'Venue & Access', isVisible: true, displayOrder: 5 },
    ],
    contactEmail: '',
    contactPhone: '',
    address: '',
    footerText: '',
    socialLinks: {},
    seoTitle: '',
    seoDescription: '',
  });

  // Undo / Redo History Stack
  const [history, setHistory] = useState<WebsiteConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const pushConfig = useCallback((newConfig: WebsiteConfig) => {
    setConfig(newConfig);
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      return [...slice, newConfig];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setConfig(history[prevIdx]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setConfig(history[nextIdx]);
    }
  }, [historyIndex, history]);

  // Multi-Page Architecture
  const [pages, setPages] = useState<WebsitePageItem[]>(DEFAULT_PAGES);
  const [activePageId, setActivePageId] = useState<string>('p_home');
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({ title: '', slug: '', navLabel: '', customHeadline: '', customDescription: '' });

  // Add Section Modal
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [canvasMobileMenuOpen, setCanvasMobileMenuOpen] = useState(false);
  const [eventData, setEventData] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Asset Studio State
  const [assetFilterCategory, setAssetFilterCategory] = useState<'all' | 'logo' | 'hero' | 'section' | 'stock'>('all');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Fetch Website Configuration
  const fetchWebsiteConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventSlug}/website`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load website configuration');

      setEventData(data.event);
      if (data.website) {
        if (data.website.theme?.pages && Array.isArray(data.website.theme.pages)) {
          setPages(data.website.theme.pages);
        }
        const loadedConfig: WebsiteConfig = {
          isPublished: data.website.isPublished ?? true,
          theme: {
            primaryColor: '#2563eb',
            secondaryColor: '#4f46e5',
            accentColor: '#06b6d4',
            darkMode: false,
            templateId: 'tpl_flagship_summit',
            fontFamily: 'plus_jakarta',
            heroLayout: 'split',
            cardStyle: 'bordered',
            ...(data.website.theme || {}),
          },
          heroTitle: data.website.heroTitle || data.event.name,
          heroSubtitle: data.website.heroSubtitle || 'Join us for our upcoming premier conference.',
          heroCoverUrl: data.website.heroCoverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
          logoUrl: data.website.logoUrl || '',
          aboutText: data.website.aboutText || 'This signature conference gathers leaders, practitioners, and pioneers.',
          sectionsConfig: data.website.sectionsConfig && data.website.sectionsConfig.length > 0
            ? data.website.sectionsConfig
            : [
              { id: 'about', title: 'About Event', isVisible: true, displayOrder: 0 },
              { id: 'tickets', title: 'Passes & Registration', isVisible: true, displayOrder: 1 },
              { id: 'speakers', title: 'Keynote Speakers', isVisible: true, displayOrder: 2 },
              { id: 'agenda', title: 'Program Agenda', isVisible: true, displayOrder: 3 },
              { id: 'sponsors', title: 'Sponsors & Partners', isVisible: true, displayOrder: 4 },
              { id: 'contact', title: 'Venue & Access', isVisible: true, displayOrder: 5 },
            ],
          contactEmail: data.website.contactEmail || '',
          contactPhone: data.website.contactPhone || '',
          address: data.website.address || '',
          footerText: data.website.footerText || '',
          socialLinks: data.website.socialLinks || {},
          seoTitle: data.website.seoTitle || '',
          seoDescription: data.website.seoDescription || '',
        };
        setConfig(loadedConfig);
        setHistory([loadedConfig]);
        setHistoryIndex(0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchWebsiteConfig();
  }, [fetchWebsiteConfig]);

  // Save Website Configuration
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const payload = {
        ...config,
        theme: {
          ...config.theme,
          pages,
        },
      };

      const res = await fetch(`/api/events/${eventSlug}/website`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save website changes');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Comprehensive Template Application with Design Tokens
  const handleApplyTemplate = (tpl: WebsiteTemplatePreset) => {
    const updated: WebsiteConfig = {
      ...config,
      theme: {
        ...config.theme,
        primaryColor: tpl.theme.primaryColor,
        secondaryColor: tpl.theme.secondaryColor,
        accentColor: tpl.theme.accentColor,
        darkMode: tpl.theme.darkMode,
        templateId: tpl.id,
        gradientStyle: tpl.theme.gradientStyle || 'linear',
        fontHeading: tpl.theme.fontHeading,
        fontBody: tpl.theme.fontBody,
        fontFamily: tpl.theme.fontHeading,
        heroLayout: tpl.theme.heroLayout,
        cardStyle: tpl.theme.cardStyle,

        // Apply all rich styling tokens
        headerBgColor: tpl.theme.headerBgColor,
        headerTextColor: tpl.theme.headerTextColor,
        headerCtaBg: tpl.theme.headerCtaBg,
        headerCtaTextColor: tpl.theme.headerCtaTextColor,
        buttonBgColor: tpl.theme.buttonBgColor,
        buttonTextColor: tpl.theme.buttonTextColor,
        buttonBorderRadius: tpl.theme.buttonBorderRadius,
        heroBgColor: tpl.theme.heroBgColor,
        heroTextColor: tpl.theme.heroTextColor,
        heroSubtextColor: tpl.theme.heroSubtextColor,
        heroHideOverlay: tpl.theme.heroHideOverlay ?? false,
        heroOverlayOpacity: tpl.theme.heroOverlayOpacity ?? 30,
        heroOverlayColor: tpl.theme.heroOverlayColor,
        cardBgColor: tpl.theme.cardBgColor,
        cardBorderColor: tpl.theme.cardBorderColor,
        cardTextColor: tpl.theme.cardTextColor,
        cardBorderRadius: tpl.theme.cardBorderRadius,
        footerBgColor: tpl.theme.footerBgColor,
        footerTextColor: tpl.theme.footerTextColor,
      },
      heroCoverUrl: tpl.sampleHero.coverUrl || config.heroCoverUrl,
      sectionsConfig: tpl.defaultSections.map((s, idx) => {
        const existing = config.sectionsConfig.find((e) => e.id === s.id);
        return {
          ...s,
          displayOrder: idx,
          elements: existing?.elements || [],
          layout: existing?.layout || 'stack',
        };
      }),
    };
    pushConfig(updated);
  };

  // Section Ordering and Operations
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= config.sectionsConfig.length) return;
    const reordered = [...config.sectionsConfig];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);
    pushConfig({
      ...config,
      sectionsConfig: reordered.map((s, i) => ({ ...s, displayOrder: i })),
    });
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const updated = config.sectionsConfig.map((s) =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    pushConfig({ ...config, sectionsConfig: updated });
  };

  const deleteSection = (sectionId: string) => {
    const updated = config.sectionsConfig.filter((s) => s.id !== sectionId);
    pushConfig({ ...config, sectionsConfig: updated });
    if (selectedEntity.id === sectionId) {
      setSelectedEntity({ type: 'canvas' });
    }
  };

  const duplicateSection = (sectionId: string) => {
    const target = config.sectionsConfig.find((s) => s.id === sectionId);
    if (!target) return;
    const duplicated: CustomSectionItem = {
      ...target,
      id: `${target.id}_copy_${Date.now()}`,
      title: `${target.title} (Copy)`,
      displayOrder: config.sectionsConfig.length,
      elements: (target.elements || []).map((el) => ({ ...el, id: `${el.id}_c_${Date.now()}` })),
    };
    pushConfig({
      ...config,
      sectionsConfig: [...config.sectionsConfig, duplicated],
    });
  };

  const handleAddSection = (preset: { id: string; title: string }) => {
    const existing = config.sectionsConfig.find((s) => s.id === preset.id);
    if (existing) {
      toggleSectionVisibility(preset.id);
      return;
    }
    const newSec: CustomSectionItem = {
      id: preset.id,
      title: preset.title,
      isVisible: true,
      displayOrder: config.sectionsConfig.length,
    };
    pushConfig({
      ...config,
      sectionsConfig: [...config.sectionsConfig, newSec],
    });
  };

  const handleAddBlankCustomSection = (layout: 'stack' | 'grid' | 'columns-2' | 'columns-3' | 'freeform' = 'stack') => {
    const newId = `custom_sec_${Date.now()}`;
    const newSec: CustomSectionItem = {
      id: newId,
      title: layout === 'columns-2' ? 'Two-Column Showcase' : 'Custom Section Block',
      type: 'custom',
      isVisible: true,
      displayOrder: config.sectionsConfig.length,
      layout,
      bgColor: config.theme.darkMode ? '#0f172a' : '#ffffff',
      textColor: config.theme.darkMode ? '#f8fafc' : '#0f172a',
      elements: createDefaultElementsForCustomSection(layout),
    };
    pushConfig({
      ...config,
      sectionsConfig: [...config.sectionsConfig, newSec],
    });
    setSelectedEntity({ type: 'section', id: newId });
    setShowAddSectionModal(false);
  };

  // Element Manipulation Operations
  const handleSelectElement = (sectionId: string, elementId: string) => {
    setSelectedEntity({ type: 'element', id: sectionId, elementId });
  };

  const handleUpdateElement = (sectionId: string, elementId: string, patch: Partial<WebsiteElement>) => {
    const updatedSections = config.sectionsConfig.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const updatedElements = (sec.elements || []).map((el) => {
        if (el.id !== elementId) return el;

        // Wix Studio-style cascading breakpoint overrides
        if (previewDevice === 'mobile') {
          const responsiveProps = ['x', 'y', 'width', 'height', 'fontSize', 'textAlign', 'hidden', 'padding'];
          const mobilePatch: any = { ...(el.mobile || {}) };
          let hasMobileProp = false;
          const basePatch: any = { ...patch };

          for (const key of responsiveProps) {
            if (key in patch) {
              mobilePatch[key] = (patch as any)[key];
              hasMobileProp = true;
              delete basePatch[key]; // Keep desktop base untouched!
            }
          }

          if (hasMobileProp) {
            return { ...el, ...basePatch, mobile: mobilePatch };
          }
        } else if (previewDevice === 'tablet') {
          const responsiveProps = ['x', 'y', 'width', 'height', 'fontSize', 'textAlign', 'hidden', 'padding'];
          const tabletPatch: any = { ...(el.tablet || {}) };
          let hasTabletProp = false;
          const basePatch: any = { ...patch };

          for (const key of responsiveProps) {
            if (key in patch) {
              tabletPatch[key] = (patch as any)[key];
              hasTabletProp = true;
              delete basePatch[key];
            }
          }

          if (hasTabletProp) {
            return { ...el, ...basePatch, tablet: tabletPatch };
          }
        }

        return { ...el, ...patch };
      });
      return { ...sec, elements: updatedElements };
    });
    pushConfig({ ...config, sectionsConfig: updatedSections });
  };

  const handleDeleteElement = (sectionId: string, elementId: string) => {
    const updatedSections = config.sectionsConfig.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        elements: (sec.elements || []).filter((el) => el.id !== elementId),
      };
    });
    pushConfig({ ...config, sectionsConfig: updatedSections });
    setSelectedEntity({ type: 'section', id: sectionId });
  };

  const handleDuplicateElement = (sectionId: string, elementId: string) => {
    const sec = config.sectionsConfig.find((s) => s.id === sectionId);
    if (!sec) return;
    const el = (sec.elements || []).find((e) => e.id === elementId);
    if (!el) return;

    const dupEl: WebsiteElement = {
      ...el,
      id: `el_${el.type}_${Date.now()}`,
      x: Math.min(80, el.x + 4),
      y: Math.min(80, el.y + 4),
    };

    const updatedSections = config.sectionsConfig.map((s) => {
      if (s.id !== sectionId) return s;
      return { ...s, elements: [...(s.elements || []), dupEl] };
    });
    pushConfig({ ...config, sectionsConfig: updatedSections });
    setSelectedEntity({ type: 'element', id: sectionId, elementId: dupEl.id });
  };

  const handleAddElementToSection = (sectionId: string, type: WebsiteElement['type']) => {
    let newEl: WebsiteElement;
    if (type === 'button') {
      newEl = {
        id: `el_btn_${Date.now()}`,
        type: 'button',
        x: 35,
        y: 40,
        width: 30,
        height: 44,
        buttonText: 'Action Button',
        buttonLink: '#tickets',
        buttonBg: config.theme.primaryColor || '#2563eb',
        buttonTextColor: '#ffffff',
        buttonRadius: 10,
        buttonIcon: 'arrow',
      };
    } else if (type === 'image') {
      newEl = {
        id: `el_img_${Date.now()}`,
        type: 'image',
        x: 20,
        y: 20,
        width: 60,
        height: 220,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        imageRadius: 14,
        objectFit: 'cover',
      };
    } else if (type === 'card') {
      newEl = {
        id: `el_crd_${Date.now()}`,
        type: 'card',
        x: 10,
        y: 20,
        width: 80,
        height: 140,
        cardBg: '#ffffff',
        cardBorder: '#e2e8f0',
        cardRadius: 16,
        cardPadding: 20,
        content: 'Highlight card container with custom content.',
      };
    } else if (type === 'badge') {
      newEl = {
        id: `el_bdg_${Date.now()}`,
        type: 'badge',
        x: 40,
        y: 15,
        width: 20,
        height: 32,
        content: 'Featured Highlight',
      };
    } else if (type === 'divider') {
      newEl = {
        id: `el_div_${Date.now()}`,
        type: 'divider',
        x: 10,
        y: 50,
        width: 80,
        height: 8,
      };
    } else {
      newEl = {
        id: `el_txt_${Date.now()}`,
        type: 'text',
        x: 15,
        y: 20,
        width: 70,
        height: 48,
        content: 'Custom headline or paragraph statement.',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0f172a',
      };
    }

    const updatedSections = config.sectionsConfig.map((s) => {
      if (s.id !== sectionId) return s;
      return { ...s, elements: [...(s.elements || []), newEl] };
    });
    pushConfig({ ...config, sectionsConfig: updatedSections });
    setSelectedEntity({ type: 'element', id: sectionId, elementId: newEl.id });
  };

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (selectedEntity.type === 'element' && selectedEntity.id && selectedEntity.elementId) {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const sec = config.sectionsConfig.find((s) => s.id === selectedEntity.id);
          const el = (sec?.elements || []).find((x) => x.id === selectedEntity.elementId);
          if (el && !el.locked) handleUpdateElement(selectedEntity.id, el.id, { x: Math.max(0, el.x - step) });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const sec = config.sectionsConfig.find((s) => s.id === selectedEntity.id);
          const el = (sec?.elements || []).find((x) => x.id === selectedEntity.elementId);
          if (el && !el.locked) handleUpdateElement(selectedEntity.id, el.id, { x: Math.min(100 - el.width, el.x + step) });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const sec = config.sectionsConfig.find((s) => s.id === selectedEntity.id);
          const el = (sec?.elements || []).find((x) => x.id === selectedEntity.elementId);
          if (el && !el.locked) handleUpdateElement(selectedEntity.id, el.id, { y: Math.max(0, el.y - step) });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const sec = config.sectionsConfig.find((s) => s.id === selectedEntity.id);
          const el = (sec?.elements || []).find((x) => x.id === selectedEntity.elementId);
          if (el && !el.locked) handleUpdateElement(selectedEntity.id, el.id, { y: Math.min(95, el.y + step) });
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteElement(selectedEntity.id, selectedEntity.elementId);
        } else if (e.key === 'Escape') {
          setSelectedEntity({ type: 'canvas' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, config.sectionsConfig, undo, redo]);

  // Resolve Currently Selected Element if any
  const selectedElement = (() => {
    if (selectedEntity.type !== 'element' || !selectedEntity.id || !selectedEntity.elementId) return null;
    const sec = config.sectionsConfig.find((s) => s.id === selectedEntity.id);
    return (sec?.elements || []).find((el) => el.id === selectedEntity.elementId) || null;
  })();

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans select-none overflow-hidden">
      {/* TOP APPLICATION APPBAR */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <BackButton href={`/events/${eventSlug}`} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Public Website Builder & Theme Studio
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Canva Visual Mode
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {eventData?.name || eventSlug} • Visual drag, drop, resize, and real-time public site synchronization.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Device Switcher & Zoom */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            title="Desktop View (100%)"
            onClick={() => setPreviewDevice('desktop')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              previewDevice === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            title="Tablet View (768px)"
            onClick={() => setPreviewDevice('tablet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              previewDevice === 'tablet'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet (768)</span>
          </button>
          <button
            type="button"
            title="Mobile View (375px)"
            onClick={() => setPreviewDevice('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              previewDevice === 'mobile'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (390)</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`/p/${eventSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">View Public Site</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Website'}</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE LAYOUT (3 COLUMNS: TOOLS | CANVAS | PROPERTIES) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TOOL RAIL (64px) */}
        <nav aria-label="Studio Tools" className="w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-1.5 shrink-0 z-10 shadow-xs">
          {[
            { id: 'templates', label: 'Templates', icon: Sparkles },
            { id: 'elements', label: 'Elements', icon: PlusCircle },
            { id: 'pages', label: 'Pages', icon: LayoutTemplate },
            { id: 'assets', label: 'Assets', icon: ImageIcon },
            { id: 'design', label: 'Design', icon: Palette },
            { id: 'layers', label: 'Layers', icon: Layers },
            { id: 'seo', label: 'SEO', icon: Search },
          ].map((tool) => {
            const IconComponent = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(isActive ? null : (tool.id as typeof activeTool))}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={tool.label}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-[9px] tracking-tight">{tool.label}</span>
              </button>
            );
          })}
        </nav>

        {/* LEFT COLLAPSIBLE TOOL DRAWER (320px) */}
        {activeTool && (
          <aside aria-label="Tool Drawer" className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden z-10 shadow-md">
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {activeTool === 'templates' && '10 Website Templates'}
                {activeTool === 'elements' && 'Add Elements & Blocks'}
                {activeTool === 'pages' && `Pages (${pages.length})`}
                {activeTool === 'assets' && 'Media & Asset Studio'}
                {activeTool === 'design' && 'Design & Branding'}
                {activeTool === 'layers' && 'Page Layers & Sections'}
                {activeTool === 'seo' && 'SEO & Social Metadata'}
              </span>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 1. TEMPLATES DRAWER */}
              {activeTool === 'templates' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Choose from 10 distinct professional presets. Applying updates styling, fonts, and layout while preserving your event data.
                  </p>
                  <div className="space-y-3">
                    {WEBSITE_TEMPLATES.map((tpl) => {
                      const isSelected = config.theme.templateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleApplyTemplate(tpl)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 hover:shadow-xs'
                          }`}
                        >
                          <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2 relative">
                            <img src={tpl.sampleHero.coverUrl} alt={tpl.name} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white backdrop-blur-xs">
                              {tpl.category}
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-xs">
                                Active
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{tpl.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{tpl.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. ELEMENTS DRAWER */}
              {activeTool === 'elements' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Custom Section Block</span>
                  </button>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Visual Drag Elements (Click to Place)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'text', title: 'Text Statement', icon: Type },
                        { type: 'button', title: 'Action Button', icon: Sparkles },
                        { type: 'image', title: 'Image Graphic', icon: ImageIcon },
                        { type: 'card', title: 'Container Card', icon: LayoutGrid },
                        { type: 'badge', title: 'Highlight Badge', icon: Award },
                        { type: 'divider', title: 'Divider Line', icon: Sliders },
                      ].map((item) => {
                        const IconC = item.icon;
                        const targetSectionId =
                          selectedEntity.type === 'section' && selectedEntity.id
                            ? selectedEntity.id
                            : config.sectionsConfig[0]?.id || 'about';
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => handleAddElementToSection(targetSectionId, item.type as any)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-800 text-left flex items-center gap-2 transition hover:shadow-xs"
                          >
                            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              <IconC className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold">{item.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Predefined Event Modules
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'agenda', title: 'Schedule Agenda', icon: Clock },
                        { id: 'speakers', title: 'Speakers Faculty', icon: Users },
                        { id: 'tickets', title: 'Tickets & Passes', icon: Ticket },
                        { id: 'sponsors', title: 'Sponsors Grid', icon: Award },
                        { id: 'contact', title: 'Contact & Venue', icon: MapPin },
                        { id: 'faq', title: 'FAQ Accordion', icon: HelpCircle },
                        { id: 'countdown', title: 'Countdown Timer', icon: Timer },
                        { id: 'exhibitors', title: 'Exhibitor Expo', icon: LayoutGrid },
                      ].map((el) => {
                        const IconComp = el.icon;
                        const isAdded = config.sectionsConfig.some((s) => s.id === el.id && s.isVisible);
                        return (
                          <button
                            key={el.id}
                            type="button"
                            onClick={() => handleAddSection(el)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1.5 transition ${
                              isAdded
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-xs bg-white dark:bg-slate-800'
                            }`}
                          >
                            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{el.title}</div>
                              <span className="text-[9px] text-slate-500 block">{isAdded ? '✓ Enabled' : '+ Add to page'}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PAGES DRAWER */}
              {activeTool === 'pages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Navigation Pages</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPageId(null);
                        setPageForm({ title: '', slug: '', navLabel: '', customHeadline: '', customDescription: '' });
                        setShowAddPageModal(true);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Page</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pages.map((p) => {
                      const isActive = activePageId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setActivePageId(p.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                            isActive
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {p.isHome ? <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span className="text-xs font-semibold truncate">{p.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. ASSETS & STOCK MEDIA DRAWER */}
              {activeTool === 'assets' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Upload Custom Assets</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center bg-slate-50 dark:bg-slate-800">
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-bold">Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => pushConfig({ ...config, logoUrl: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      <label className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center bg-slate-50 dark:bg-slate-800">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-bold">Upload Banner</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => pushConfig({ ...config, heroCoverUrl: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Royalty-Free Stock Photography</span>
                    <div className="space-y-2">
                      {STOCK_LIBRARY.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                          <img src={item.url} alt={item.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate">{item.title}</span>
                            <span className="text-[9px] text-slate-500 block truncate">{item.tag}</span>
                            <div className="flex gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => pushConfig({ ...config, heroCoverUrl: item.url })}
                                className="text-[9px] font-bold text-blue-600 hover:underline"
                              >
                                Set as Banner
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. DESIGN & BRANDING DRAWER */}
              {activeTool === 'design' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Color Palette</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Primary</span>
                        <div className="flex items-center gap-1.5 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <input
                            type="color"
                            value={config.theme.primaryColor || '#2563eb'}
                            onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[10px] font-mono">{config.theme.primaryColor || '#2563eb'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Secondary</span>
                        <div className="flex items-center gap-1.5 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <input
                            type="color"
                            value={config.theme.secondaryColor || '#4f46e5'}
                            onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, secondaryColor: e.target.value } })}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[10px] font-mono">{config.theme.secondaryColor || '#4f46e5'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Accent</span>
                        <div className="flex items-center gap-1.5 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <input
                            type="color"
                            value={config.theme.accentColor || '#06b6d4'}
                            onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, accentColor: e.target.value } })}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[10px] font-mono">{config.theme.accentColor || '#06b6d4'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Typography & Google Fonts</label>
                    <div className="space-y-1.5">
                      {WEBSITE_FONTS.map((font) => {
                        const isSelected = (config.theme.fontFamily || 'plus_jakarta') === font.id;
                        return (
                          <div
                            key={font.id}
                            onClick={() => pushConfig({ ...config, theme: { ...config.theme, fontFamily: font.id } })}
                            className={`p-2.5 rounded-xl border cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold" style={{ fontFamily: font.family }}>{font.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{font.category}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. LAYERS & SECTIONS DRAWER */}
              {activeTool === 'layers' && (
                <div className="space-y-2">
                  <div
                    onClick={() => setSelectedEntity({ type: 'header' })}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer ${
                      selectedEntity.type === 'header' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'
                    }`}
                  >
                    <span>Header Bar</span>
                  </div>

                  <div
                    onClick={() => setSelectedEntity({ type: 'hero' })}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer ${
                      selectedEntity.type === 'hero' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'
                    }`}
                  >
                    <span>Hero Section</span>
                  </div>

                  {config.sectionsConfig.map((sec, idx) => (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedEntity({ type: 'section', id: sec.id })}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${
                        selectedEntity.type === 'section' && selectedEntity.id === sec.id
                          ? 'border-blue-500 bg-blue-50/50 font-bold'
                          : 'border-slate-200'
                      }`}
                    >
                      <span>{sec.title}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionVisibility(sec.id);
                          }}
                          className="p-0.5 text-slate-400 hover:text-blue-600"
                        >
                          {sec.isVisible ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() => setSelectedEntity({ type: 'footer' })}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer ${
                      selectedEntity.type === 'footer' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'
                    }`}
                  >
                    <span>Footer</span>
                  </div>
                </div>
              )}

              {/* 7. SEO METADATA DRAWER */}
              {activeTool === 'seo' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={config.seoTitle}
                      onChange={(e) => pushConfig({ ...config, seoTitle: e.target.value })}
                      placeholder="Event Name | Official Passes"
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">SEO Description</label>
                    <textarea
                      rows={4}
                      value={config.seoDescription}
                      onChange={(e) => pushConfig({ ...config, seoDescription: e.target.value })}
                      placeholder="Meta summary for Google and social previews..."
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CENTER LIVE EDITABLE CANVAS WORKSPACE */}
        <main
          className="flex-1 bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-start overflow-auto relative"
          onClick={() => setSelectedEntity({ type: 'canvas' })}
        >
          {/* Sized Device Container */}
          <div
            style={{
              transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
              transformOrigin: 'top center',
              fontFamily: getFontFamilyCss(config.theme.fontFamily),
            }}
            className={`w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-slate-300 dark:border-slate-800 flex flex-col shrink-0 ${
              previewDevice === 'desktop'
                ? 'max-w-5xl'
                : previewDevice === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-[390px]'
            }`}
          >
            {/* 1. EDITABLE HEADER SECTION */}
            <div
              id="canvas-header"
              data-testid="canvas-header"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEntity({ type: 'header' });
              }}
              className={`p-4 border-b flex items-center justify-between gap-4 transition cursor-pointer relative group ${
                selectedEntity.type === 'header'
                  ? 'ring-2 ring-blue-600 rounded-t-2xl z-10'
                  : 'hover:ring-1 hover:ring-blue-400'
              }`}
              style={{
                backgroundColor: config.theme.headerBgColor || (config.theme.darkMode ? '#090d16' : '#ffffff'),
                borderColor: config.theme.headerBorderColor || (config.theme.darkMode ? '#1e293b' : '#e2e8f0'),
                borderBottomWidth: config.theme.headerBorderWidth !== undefined ? `${config.theme.headerBorderWidth}px` : undefined,
                color: config.theme.headerTextColor || undefined,
                minHeight: config.theme.headerHeight ? `${config.theme.headerHeight}px` : undefined,
                paddingLeft: config.theme.headerPaddingX ? `${config.theme.headerPaddingX}px` : undefined,
                paddingRight: config.theme.headerPaddingX ? `${config.theme.headerPaddingX}px` : undefined,
                paddingTop: config.theme.headerPaddingY ? `${config.theme.headerPaddingY}px` : undefined,
                paddingBottom: config.theme.headerPaddingY ? `${config.theme.headerPaddingY}px` : undefined,
                boxShadow: config.theme.headerShadow === 'none' ? 'none' : config.theme.headerShadow === 'sm' ? '0 1px 2px 0 rgba(0,0,0,0.05)' : config.theme.headerShadow === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : config.theme.headerShadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    style={{
                      width: config.theme.headerLogoWidth ? `${config.theme.headerLogoWidth}px` : undefined,
                      height: config.theme.headerLogoHeight ? `${config.theme.headerLogoHeight}px` : '36px',
                      objectFit: config.theme.headerLogoFit || 'contain',
                    }}
                  />
                ) : (
                  <div
                    className="rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
                    style={{
                      backgroundColor: config.theme.primaryColor || '#2563eb',
                      width: config.theme.headerLogoWidth ? `${Math.min(config.theme.headerLogoWidth, 48)}px` : '32px',
                      height: config.theme.headerLogoHeight ? `${Math.min(config.theme.headerLogoHeight, 48)}px` : '32px',
                    }}
                  >
                    {(eventData?.name || 'MS')[0]}
                  </div>
                )}
                {config.theme.headerShowTitle !== false && (
                  <div>
                    <span
                      className="font-bold block leading-tight"
                      style={{
                        color: config.theme.headerTitleColor || config.theme.headerTextColor || undefined,
                        fontFamily: config.theme.headerTitleFontFamily ? getFontFamilyCss(config.theme.headerTitleFontFamily) : undefined,
                        fontSize: config.theme.headerTitleFontSize ? `${config.theme.headerTitleFontSize}px` : '14px',
                        fontWeight: config.theme.headerTitleFontWeight || 'bold',
                      }}
                    >
                      {config.theme.headerTitleText || eventData?.name || config.heroTitle || 'Summit 2026'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Official Event Portal</span>
                  </div>
                )}
              </div>

              {/* Desktop / Tablet Navigation Items */}
              {previewDevice !== 'mobile' ? (
                <div
                  className="flex items-center font-semibold"
                  style={{
                    gap: config.theme.headerNavSpacing !== undefined ? `${config.theme.headerNavSpacing}px` : '12px',
                    fontFamily: config.theme.headerNavFontFamily ? getFontFamilyCss(config.theme.headerNavFontFamily) : undefined,
                    fontSize: config.theme.headerNavFontSize ? `${config.theme.headerNavFontSize}px` : '12px',
                  }}
                >
                  {config.sectionsConfig.filter((s) => s.isVisible).slice(0, 6).map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(sec.id);
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                        setSelectedEntity({ type: 'section', id: sec.id });
                      }}
                      className="hover:opacity-75 transition"
                      style={{ color: config.theme.headerTextColor || undefined }}
                    >
                      {sec.title}
                    </a>
                  ))}
                </div>
              ) : null}

              {/* Action Buttons & Mobile Hamburger */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{
                    backgroundColor: config.theme.headerCtaBg || config.theme.buttonBgColor || config.theme.primaryColor || '#2563eb',
                    color: config.theme.headerCtaTextColor || config.theme.buttonTextColor || '#ffffff',
                    borderRadius: config.theme.headerCtaBorderRadius || config.theme.buttonBorderRadius || '8px',
                  }}
                >
                  {config.theme.headerCtaText || config.theme.ctaButtonText || 'Register'}
                </button>

                {previewDevice === 'mobile' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCanvasMobileMenuOpen(!canvasMobileMenuOpen);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Toggle Mobile Navigation Drawer"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                )}
              </div>

              {selectedEntity.type === 'header' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-xs pointer-events-none">
                  HEADER SELECTED
                </div>
              )}
            </div>

            {/* Mobile Navigation Drawer inside Canvas */}
            {previewDevice === 'mobile' && canvasMobileMenuOpen && (
              <div className="w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150 z-20">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Mobile Menu Navigation
                </span>
                {config.sectionsConfig.filter((s) => s.isVisible).map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById(sec.id);
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                      setSelectedEntity({ type: 'section', id: sec.id });
                      setCanvasMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-xs font-semibold py-1.5 text-slate-800 dark:text-slate-100 hover:text-blue-600 border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <span>{sec.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ))}
              </div>
            )}

            {/* 2. EDITABLE HERO BANNER SECTION */}
            <div
              id="hero"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEntity({ type: 'hero' });
              }}
              className={`relative overflow-hidden p-6 sm:p-14 transition cursor-pointer group ${
                selectedEntity.type === 'hero'
                  ? 'ring-2 ring-blue-600 z-10'
                  : 'hover:ring-1 hover:ring-blue-400'
              }`}
              style={{
                backgroundColor: config.theme.heroBgColor ? config.theme.heroBgColor : (config.theme.heroHideOverlay ? 'transparent' : (config.theme.darkMode ? '#090d16' : '#0f172a')),
                color: config.theme.heroTextColor || '#ffffff',
                minHeight: config.theme.heroMinHeight ? `${config.theme.heroMinHeight}px` : (previewDevice === 'mobile' ? '300px' : '360px'),
                paddingTop: config.theme.heroPaddingY ? `${config.theme.heroPaddingY}px` : undefined,
                paddingBottom: config.theme.heroPaddingY ? `${config.theme.heroPaddingY}px` : undefined,
              }}
            >
              {config.heroCoverUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <img
                    src={config.heroCoverUrl}
                    alt="Hero Banner"
                    className="w-full h-full object-cover object-center"
                  />
                  {!config.theme.heroHideOverlay && (config.theme.heroOverlayOpacity ?? 25) > 0 && (
                    <div
                      className="absolute inset-0 transition-opacity duration-200"
                      style={{
                        backgroundColor: config.theme.heroOverlayColor || config.theme.heroBgColor || '#000000',
                        opacity: (config.theme.heroOverlayOpacity ?? 25) / 100,
                      }}
                    />
                  )}
                </div>
              )}

              <div
                className={`relative z-10 max-w-3xl space-y-4 ${
                  config.theme.heroAlignment === 'center'
                    ? 'mx-auto text-center'
                    : config.theme.heroAlignment === 'right'
                    ? 'ml-auto text-right'
                    : 'text-left'
                }`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{config.theme.heroEyebrow || 'Official Registration Open'}</span>
                </div>

                <h1
                  className={`font-extrabold tracking-tight leading-tight ${
                    previewDevice === 'mobile' ? 'text-2xl' : 'text-2xl sm:text-4xl'
                  }`}
                  style={{
                    fontFamily: config.theme.heroTitleFontFamily ? getFontFamilyCss(config.theme.heroTitleFontFamily) : undefined,
                    fontWeight: config.theme.heroTitleFontWeight || undefined,
                    color: config.theme.heroTitleColor || config.theme.heroTextColor || '#ffffff',
                    fontSize:
                      previewDevice === 'mobile' && config.theme.heroResponsive?.mobile?.titleSize
                        ? `${config.theme.heroResponsive.mobile.titleSize}px`
                        : config.theme.heroTitleFontSize
                        ? `${config.theme.heroTitleFontSize}px`
                        : undefined,
                  }}
                >
                  {config.heroTitle || eventData?.name || 'Global Event Summit 2026'}
                </h1>

                <p
                  className="text-sm sm:text-base opacity-85 leading-relaxed max-w-2xl"
                  style={{
                    fontFamily: config.theme.heroSubtitleFontFamily ? getFontFamilyCss(config.theme.heroSubtitleFontFamily) : undefined,
                    fontSize: config.theme.heroSubtitleFontSize ? `${config.theme.heroSubtitleFontSize}px` : undefined,
                    color: config.theme.heroSubtitleColor || config.theme.heroSubtextColor || undefined,
                  }}
                >
                  {config.heroSubtitle || 'Discover cutting-edge methodologies, clinical breakthroughs, and keynote addresses from international faculty.'}
                </p>

                <div
                  className={`pt-2 flex ${
                    previewDevice === 'mobile'
                      ? 'flex-col items-stretch w-full'
                      : config.theme.heroAlignment === 'center'
                      ? 'flex-wrap items-center justify-center'
                      : config.theme.heroAlignment === 'right'
                      ? 'flex-wrap items-center justify-end'
                      : 'flex-wrap items-center'
                  } gap-3`}
                >
                  <button
                    type="button"
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition ${
                      previewDevice === 'mobile' ? 'w-full text-center' : ''
                    }`}
                    style={{
                      backgroundColor: config.theme.ctaButtonBg || config.theme.buttonBgColor || config.theme.primaryColor || '#2563eb',
                      color: config.theme.ctaButtonTextColor || config.theme.buttonTextColor || '#ffffff',
                      borderRadius: config.theme.ctaButtonBorderRadius || config.theme.buttonBorderRadius || '10px',
                    }}
                  >
                    {config.theme.ctaButtonText || 'Select Passes & Register'}
                  </button>
                  <button
                    type="button"
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border backdrop-blur-xs transition ${
                      previewDevice === 'mobile' ? 'w-full text-center' : ''
                    }`}
                    style={{
                      backgroundColor: config.theme.secondaryButtonBg || 'rgba(255, 255, 255, 0.1)',
                      color: config.theme.secondaryButtonTextColor || '#ffffff',
                      borderColor: config.theme.secondaryButtonBorderColor || 'rgba(255, 255, 255, 0.2)',
                      borderRadius: config.theme.secondaryButtonBorderRadius || config.theme.buttonBorderRadius || '10px',
                    }}
                  >
                    {config.theme.secondaryButtonText || 'View Agenda & Speakers'}
                  </button>
                </div>
              </div>

              {selectedEntity.type === 'hero' && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pushConfig({
                        ...config,
                        theme: {
                          ...config.theme,
                          heroHideOverlay: !config.theme.heroHideOverlay,
                          heroOverlayOpacity: config.theme.heroHideOverlay ? 25 : 0,
                          heroBgColor: config.theme.heroHideOverlay ? config.theme.heroBgColor : '',
                        },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md transition flex items-center gap-1 ${
                      config.theme.heroHideOverlay || (config.theme.heroOverlayOpacity ?? 25) === 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {config.theme.heroHideOverlay || (config.theme.heroOverlayOpacity ?? 25) === 0
                        ? '✓ 100% Photo Mode'
                        : 'Remove Color Overlay'}
                    </span>
                  </button>

                  <div className="px-2 py-1 rounded-lg text-[9px] font-bold bg-blue-600 text-white shadow-xs pointer-events-none">
                    HERO
                  </div>
                </div>
              )}
            </div>

            {/* 3. DYNAMIC PAGE SECTIONS (WITH VISUAL DRAGGABLE ELEMENTS) */}
            <div className="p-6 sm:p-10 space-y-8">
              {config.sectionsConfig.map((sec, idx) => {
                const isSelected = selectedEntity.type === 'section' && selectedEntity.id === sec.id;
                const hasCustomElements = (sec.elements || []).length > 0;

                return (
                  <div
                    key={sec.id}
                    id={sec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntity({ type: 'section', id: sec.id });
                    }}
                    className={`rounded-2xl border p-6 transition relative cursor-pointer group min-h-[160px] ${
                      isSelected
                        ? 'ring-2 ring-blue-600 shadow-md z-10'
                        : 'hover:ring-1 hover:ring-blue-400'
                    } ${!sec.isVisible ? 'opacity-40 bg-slate-100 dark:bg-slate-900/60' : ''}`}
                    style={{
                      backgroundColor: sec.bgColor || config.theme.cardBgColor || (config.theme.darkMode ? '#0f172a' : '#ffffff'),
                      color: sec.textColor || config.theme.cardTextColor || (config.theme.darkMode ? '#f8fafc' : '#0f172a'),
                      borderColor: sec.cardBorder || config.theme.cardBorderColor || (config.theme.darkMode ? '#1e293b' : '#e2e8f0'),
                      paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : undefined,
                      paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : undefined,
                      borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                    }}
                  >
                    {/* Section Top Controls Bar */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = config.sectionsConfig.map((s) =>
                                s.id === sec.id ? { ...s, title: e.target.value } : s
                              );
                              pushConfig({ ...config, sectionsConfig: updated });
                            }}
                            className="text-sm font-bold bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-500 focus:outline-none"
                          />
                          {sec.subtitle && (
                            <p className="text-[11px] opacity-75">{sec.subtitle}</p>
                          )}
                        </div>
                      </div>

                      {/* Section Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddElementToSection(sec.id, 'text');
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                          title="Add Text to Section"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Element</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                          title="Move Section Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(idx, 'down');
                          }}
                          disabled={idx === config.sectionsConfig.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                          title="Move Section Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionVisibility(sec.id);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 transition"
                          title={sec.isVisible ? 'Hide Section' : 'Show Section'}
                        >
                          {sec.isVisible ? <ToggleRight className="w-4 h-4 text-blue-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(sec.id);
                          }}
                          className="p-1 rounded text-red-500 hover:text-red-700 transition"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section Body Visual Content */}
                    {sec.id === 'about' && (
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {config.aboutText || 'This premier gathering convenes world-class researchers, technologists, and leaders to explore breakthrough innovations.'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                            <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Global Faculty</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">International keynote addresses</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                            <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Verified Credentials</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Cryptographic digital certificates</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                            <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Interactive Expo</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Technology demonstration halls</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {sec.id === 'tickets' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <Ticket className="w-8 h-8 mx-auto text-blue-600" />
                        <div className="text-xs font-bold">Admission Passes & Registration Tier Grid</div>
                        <p className="text-[11px] text-slate-500">Live ticket tiers, early-bird rules, and Razorpay checkout rendered dynamically.</p>
                      </div>
                    )}

                    {sec.id === 'speakers' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <Users className="w-8 h-8 mx-auto text-purple-600" />
                        <div className="text-xs font-bold">Featured Keynote Faculty & Speakers</div>
                        <p className="text-[11px] text-slate-500">Speaker profile cards, bios, and session links rendered automatically.</p>
                      </div>
                    )}

                    {sec.id === 'agenda' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <Clock className="w-8 h-8 mx-auto text-emerald-600" />
                        <div className="text-xs font-bold">Schedule & Multi-Track Agenda</div>
                        <p className="text-[11px] text-slate-500">Tracks, breakout rooms, and session timings rendered automatically.</p>
                      </div>
                    )}

                    {sec.id === 'sponsors' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <Award className="w-8 h-8 mx-auto text-amber-500" />
                        <div className="text-xs font-bold">Sponsors & Corporate Partners</div>
                        <p className="text-[11px] text-slate-500">Tiered partner showcases: Platinum, Gold, and Technology Benefactors.</p>
                      </div>
                    )}

                    {sec.id === 'faq' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <HelpCircle className="w-8 h-8 mx-auto text-cyan-600" />
                        <div className="text-xs font-bold">Frequently Asked Questions (FAQ)</div>
                        <p className="text-[11px] text-slate-500">Attendee queries, accreditation policies, badge pickup, and venue details.</p>
                      </div>
                    )}

                    {sec.id === 'countdown' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <Timer className="w-8 h-8 mx-auto text-rose-500" />
                        <div className="text-xs font-bold">Live Opening Keynote Countdown</div>
                        <div className="flex justify-center gap-3 pt-2">
                          {['14 Days', '08 Hours', '32 Mins', '45 Secs'].map((t, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.id === 'exhibitors' && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <LayoutGrid className="w-8 h-8 mx-auto text-indigo-500" />
                        <div className="text-xs font-bold">Exhibitor Directory & Floor Plan</div>
                        <p className="text-[11px] text-slate-500">Interactive booth numbers, floor layout, and product catalogs.</p>
                      </div>
                    )}

                    {sec.id === 'contact' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                          <span className="font-bold block text-slate-900 dark:text-white mb-1">Venue Coordinates</span>
                          <span className="text-slate-600 dark:text-slate-300">{config.address || 'Convention Center Hall, Bengaluru'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                          <span className="font-bold block text-slate-900 dark:text-white mb-1">Contact Email</span>
                          <span className="text-blue-600">{config.contactEmail || 'admin@msbackstage.internal'}</span>
                        </div>
                      </div>
                    )}

                    {/* RENDER CUSTOM DRAGGABLE ELEMENTS IN SECTION */}
                    {hasCustomElements && (
                      <div className="relative w-full min-h-[200px] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl my-3 p-2 bg-slate-50/50 dark:bg-slate-900/40">
                        {(sec.elements || []).map((el) => {
                          const isElSelected =
                            selectedEntity.type === 'element' &&
                            selectedEntity.id === sec.id &&
                            selectedEntity.elementId === el.id;

                          return (
                            <VisualElementCanvas
                              key={el.id}
                              element={el}
                              previewDevice={previewDevice}
                              isSelected={isElSelected}
                              onSelect={() => handleSelectElement(sec.id, el.id)}
                              onUpdate={(patch) => handleUpdateElement(sec.id, el.id, patch)}
                              onDuplicate={() => handleDuplicateElement(sec.id, el.id)}
                              onDelete={() => handleDeleteElement(sec.id, el.id)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-xs pointer-events-none">
                        SECTION SELECTED
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Section Quick Trigger */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(true)}
                  className="px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Section Block</span>
                </button>
              </div>
            </div>

            {/* 4. EDITABLE FOOTER SECTION */}
            <div
              id="canvas-footer"
              data-testid="canvas-footer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEntity({ type: 'footer' });
              }}
              className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition cursor-pointer relative group ${
                selectedEntity.type === 'footer'
                  ? 'ring-2 ring-blue-600 rounded-b-2xl z-10'
                  : 'hover:ring-1 hover:ring-blue-400'
              }`}
              style={{
                backgroundColor: config.theme.footerBgColor || '#0f172a',
                color: config.theme.footerTextColor || '#94a3b8',
                borderTopColor: config.theme.footerBorderTopColor || (config.theme.darkMode ? '#1e293b' : '#e2e8f0'),
                fontSize: config.theme.footerFontSize ? `${config.theme.footerFontSize}px` : undefined,
              }}
            >
              <div>
                <p className="font-medium">{config.footerText || `© 2026 ${eventData?.name || 'MS Backstage'}. All rights reserved.`}</p>
                <p className="text-[10px] opacity-75 mt-0.5">Powered by MS Backstage • Event Operating System</p>
              </div>

              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Event Portal</span>
              </div>

              {selectedEntity.type === 'footer' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-xs pointer-events-none">
                  FOOTER SELECTED
                </div>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT CONTEXTUAL PROPERTIES INSPECTOR (300px) */}
        <aside aria-label="Properties Inspector" className="w-76 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 shadow-xs z-10">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {selectedEntity.type === 'element' && 'Element Styling'}
                {selectedEntity.type === 'header' && 'Header Settings'}
                {selectedEntity.type === 'hero' && 'Hero Section Settings'}
                {selectedEntity.type === 'section' && 'Section Properties'}
                {selectedEntity.type === 'footer' && 'Footer Properties'}
                {selectedEntity.type === 'canvas' && 'Canvas Theme Settings'}
              </span>
            </h3>
          </div>

          {/* 1. ELEMENT LEVEL PROPERTIES */}
          {selectedEntity.type === 'element' && selectedElement && selectedEntity.id && (
            <ElementPropertiesPanel
              element={selectedElement}
              previewDevice={previewDevice}
              onUpdate={(patch) => handleUpdateElement(selectedEntity.id!, selectedElement.id, patch)}
              onDelete={() => handleDeleteElement(selectedEntity.id!, selectedElement.id)}
              onDuplicate={() => handleDuplicateElement(selectedEntity.id!, selectedElement.id)}
            />
          )}

          {/* 2. HEADER PROPERTIES */}
          {selectedEntity.type === 'header' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Header Bar Appearance
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Header Background</label>
                    <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <input
                        type="color"
                        value={config.theme.headerBgColor || '#ffffff'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerBgColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono">{config.theme.headerBgColor || '#ffffff'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Navigation Text Color</label>
                    <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <input
                        type="color"
                        value={config.theme.headerTextColor || '#0f172a'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerTextColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono">{config.theme.headerTextColor || '#0f172a'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Header Height</span>
                      <span className="font-mono">{config.theme.headerHeight || 64}px</span>
                    </div>
                    <input
                      type="range"
                      min="44"
                      max="110"
                      step="2"
                      value={config.theme.headerHeight || 64}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerHeight: Number(e.target.value) } })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Padding X</span>
                        <span className="font-mono">{config.theme.headerPaddingX || 16}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="48"
                        step="2"
                        value={config.theme.headerPaddingX || 16}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerPaddingX: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Padding Y</span>
                        <span className="font-mono">{config.theme.headerPaddingY || 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="32"
                        step="2"
                        value={config.theme.headerPaddingY || 12}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerPaddingY: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Border Width & Color</span>
                      <span className="font-mono">{config.theme.headerBorderWidth ?? 1}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="4"
                        step="1"
                        value={config.theme.headerBorderWidth ?? 1}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerBorderWidth: Number(e.target.value) } })}
                        className="flex-1 accent-blue-600"
                      />
                      <input
                        type="color"
                        value={config.theme.headerBorderColor || '#e2e8f0'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerBorderColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Shadow Depth</label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['none', 'sm', 'md', 'lg'] as const).map((shadow) => (
                        <button
                          key={shadow}
                          type="button"
                          onClick={() => pushConfig({ ...config, theme: { ...config.theme, headerShadow: shadow } })}
                          className={`p-1 rounded text-[10px] uppercase font-bold border transition ${
                            (config.theme.headerShadow || 'none') === shadow
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          {shadow}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sticky Navbar on Scroll</span>
                    <button
                      type="button"
                      onClick={() => pushConfig({ ...config, theme: { ...config.theme, headerSticky: config.theme.headerSticky === false } })}
                      className="text-blue-600"
                    >
                      {config.theme.headerSticky !== false ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo Settings */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Event Logo & Sizing
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Logo Image URL</label>
                    <input
                      type="text"
                      value={config.logoUrl || ''}
                      onChange={(e) => pushConfig({ ...config, logoUrl: e.target.value })}
                      placeholder="https://... logo.png"
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Logo Width</span>
                        <span className="font-mono">{config.theme.headerLogoWidth || 36}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="180"
                        step="2"
                        value={config.theme.headerLogoWidth || 36}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerLogoWidth: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Logo Height</span>
                        <span className="font-mono">{config.theme.headerLogoHeight || 36}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="2"
                        value={config.theme.headerLogoHeight || 36}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerLogoHeight: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Logo Object Fit</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['contain', 'cover'] as const).map((fit) => (
                        <button
                          key={fit}
                          type="button"
                          onClick={() => pushConfig({ ...config, theme: { ...config.theme, headerLogoFit: fit } })}
                          className={`p-1 rounded text-xs capitalize border ${
                            (config.theme.headerLogoFit || 'contain') === fit
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Name / Brand Typography */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Event Title Text & Font
                  </span>
                  <button
                    type="button"
                    onClick={() => pushConfig({ ...config, theme: { ...config.theme, headerShowTitle: config.theme.headerShowTitle === false } })}
                    className="text-xs text-blue-600 font-medium"
                  >
                    {config.theme.headerShowTitle !== false ? 'Show Title' : 'Hidden'}
                  </button>
                </div>
                {config.theme.headerShowTitle !== false && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Title Text</label>
                      <input
                        type="text"
                        value={config.theme.headerTitleText || config.heroTitle || eventData?.name || ''}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerTitleText: e.target.value } })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Title Font Family</label>
                      <select
                        value={config.theme.headerTitleFontFamily || 'inter'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerTitleFontFamily: e.target.value } })}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                      >
                        <option value="inter">Inter (Modern Sans)</option>
                        <option value="plus_jakarta">Plus Jakarta Sans (Crisp)</option>
                        <option value="outfit">Outfit (Geometric)</option>
                        <option value="roboto">Roboto (Clean)</option>
                        <option value="playfair">Playfair Display (Editorial)</option>
                        <option value="cinzel">Cinzel (Luxury Serif)</option>
                        <option value="space_grotesk">Space Grotesk (Tech)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Font Size</span>
                          <span className="font-mono">{config.theme.headerTitleFontSize || 14}px</span>
                        </div>
                        <input
                          type="range"
                          min="11"
                          max="28"
                          step="1"
                          value={config.theme.headerTitleFontSize || 14}
                          onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerTitleFontSize: Number(e.target.value) } })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Title Color</label>
                        <div className="flex items-center gap-2 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <input
                            type="color"
                            value={config.theme.headerTitleColor || config.theme.headerTextColor || '#0f172a'}
                            onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerTitleColor: e.target.value } })}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[10px] font-mono">{config.theme.headerTitleColor || '#0f172a'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Styling */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Navigation Links Styling
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Navigation Font Family</label>
                    <select
                      value={config.theme.headerNavFontFamily || 'inter'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerNavFontFamily: e.target.value } })}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="inter">Inter</option>
                      <option value="plus_jakarta">Plus Jakarta Sans</option>
                      <option value="outfit">Outfit</option>
                      <option value="roboto">Roboto</option>
                      <option value="space_grotesk">Space Grotesk</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Font Size</span>
                        <span className="font-mono">{config.theme.headerNavFontSize || 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="18"
                        step="1"
                        value={config.theme.headerNavFontSize || 12}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerNavFontSize: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Link Spacing</span>
                        <span className="font-mono">{config.theme.headerNavSpacing || 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="32"
                        step="2"
                        value={config.theme.headerNavSpacing || 12}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerNavSpacing: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header CTA Button */}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Header CTA Button
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={config.theme.headerCtaText || config.theme.ctaButtonText || 'Register'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerCtaText: e.target.value } })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">CTA Button Background</label>
                    <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <input
                        type="color"
                        value={config.theme.headerCtaBg || config.theme.primaryColor || '#2563eb'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerCtaBg: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono">{config.theme.headerCtaBg || config.theme.primaryColor || '#2563eb'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">CTA Text Color</label>
                    <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <input
                        type="color"
                        value={config.theme.headerCtaTextColor || '#ffffff'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, headerCtaTextColor: e.target.value } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono">{config.theme.headerCtaTextColor || '#ffffff'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. HERO PROPERTIES */}
          {selectedEntity.type === 'hero' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Hero Text & Typography
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Eyebrow Badge Text</label>
                    <input
                      type="text"
                      value={config.theme.heroEyebrow || 'Official Registration Open'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroEyebrow: e.target.value } })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hero Title</label>
                    <input
                      type="text"
                      value={config.heroTitle}
                      onChange={(e) => pushConfig({ ...config, heroTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Title Font Family</label>
                    <select
                      value={config.theme.heroTitleFontFamily || 'inter'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroTitleFontFamily: e.target.value } })}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="inter">Inter (Modern Sans)</option>
                      <option value="plus_jakarta">Plus Jakarta Sans (Crisp)</option>
                      <option value="outfit">Outfit (Geometric)</option>
                      <option value="roboto">Roboto (Clean)</option>
                      <option value="playfair">Playfair Display (Editorial)</option>
                      <option value="cinzel">Cinzel (Luxury Serif)</option>
                      <option value="space_grotesk">Space Grotesk (Tech)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Title Size</span>
                        <span className="font-mono">{config.theme.heroTitleFontSize || 36}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="72"
                        step="2"
                        value={config.theme.heroTitleFontSize || 36}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroTitleFontSize: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Title Color</label>
                      <div className="flex items-center gap-2 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <input
                          type="color"
                          value={config.theme.heroTitleColor || config.theme.heroTextColor || '#ffffff'}
                          onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroTitleColor: e.target.value } })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono">{config.theme.heroTitleColor || '#ffffff'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hero Content Alignment</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => pushConfig({ ...config, theme: { ...config.theme, heroAlignment: align } })}
                          className={`p-1.5 rounded text-xs capitalize flex items-center justify-center gap-1 border transition ${
                            (config.theme.heroAlignment || 'left') === align
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                          <span>{align}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hero Subtitle</label>
                    <textarea
                      rows={3}
                      value={config.heroSubtitle}
                      onChange={(e) => pushConfig({ ...config, heroSubtitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Subtitle Size</span>
                        <span className="font-mono">{config.theme.heroSubtitleFontSize || 15}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        step="1"
                        value={config.theme.heroSubtitleFontSize || 15}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroSubtitleFontSize: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Subtitle Color</label>
                      <div className="flex items-center gap-2 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <input
                          type="color"
                          value={config.theme.heroSubtitleColor || config.theme.heroSubtextColor || '#f1f5f9'}
                          onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroSubtitleColor: e.target.value } })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono">{config.theme.heroSubtitleColor || '#f1f5f9'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Dimensions & Background */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Hero Dimensions & Background Image
                </span>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Min Height</span>
                        <span className="font-mono">{config.theme.heroMinHeight || 360}px</span>
                      </div>
                      <input
                        type="range"
                        min="260"
                        max="700"
                        step="20"
                        value={config.theme.heroMinHeight || 360}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroMinHeight: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Padding Y</span>
                        <span className="font-mono">{config.theme.heroPaddingY || 56}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="120"
                        step="4"
                        value={config.theme.heroPaddingY || 56}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, heroPaddingY: Number(e.target.value) } })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Background Image URL</label>
                    <input
                      type="text"
                      value={config.heroCoverUrl}
                      onChange={(e) => pushConfig({ ...config, heroCoverUrl: e.target.value })}
                      placeholder="https://... cover.jpg"
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>

                  {/* Clean Photo / Tint Overlay Control */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hero Photo Visibility</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          config.theme.heroHideOverlay || (config.theme.heroOverlayOpacity ?? 25) === 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {config.theme.heroHideOverlay || (config.theme.heroOverlayOpacity ?? 25) === 0
                          ? '100% Clean Photo'
                          : `${config.theme.heroOverlayOpacity ?? 25}% Tint`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        pushConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            heroHideOverlay: !config.theme.heroHideOverlay,
                            heroOverlayOpacity: config.theme.heroHideOverlay ? 25 : 0,
                            heroBgColor: config.theme.heroHideOverlay ? config.theme.heroBgColor : '',
                          },
                        })
                      }
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                        config.theme.heroHideOverlay || (config.theme.heroOverlayOpacity ?? 25) === 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {config.theme.heroHideOverlay || (config.theme.heroOverlayOpacity ?? 25) === 0
                          ? '✓ Color Overlay Removed (100% Photo)'
                          : 'Remove Color Overlay'}
                      </span>
                    </button>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Overlay Opacity</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {config.theme.heroHideOverlay ? '0%' : `${config.theme.heroOverlayOpacity ?? 25}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={config.theme.heroHideOverlay ? 0 : (config.theme.heroOverlayOpacity ?? 25)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          pushConfig({
                            ...config,
                            theme: {
                              ...config.theme,
                              heroOverlayOpacity: val,
                              heroHideOverlay: val === 0,
                            },
                          });
                        }}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero CTA & Secondary Buttons */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Action Buttons Customization
                </span>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Primary CTA Button</label>
                  <input
                    type="text"
                    value={config.theme.ctaButtonText || 'Select Passes & Register'}
                    onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, ctaButtonText: e.target.value } })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    placeholder="Button Label"
                  />
                  <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <input
                      type="color"
                      value={config.theme.ctaButtonBg || config.theme.buttonBgColor || config.theme.primaryColor || '#2563eb'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, ctaButtonBg: e.target.value } })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{config.theme.ctaButtonBg || config.theme.primaryColor || '#2563eb'}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Secondary Button</label>
                  <input
                    type="text"
                    value={config.theme.secondaryButtonText || 'View Agenda & Speakers'}
                    onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, secondaryButtonText: e.target.value } })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    placeholder="Button Label"
                  />
                  <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <input
                      type="color"
                      value={config.theme.secondaryButtonBg || '#1e293b'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, secondaryButtonBg: e.target.value } })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{config.theme.secondaryButtonBg || '#1e293b'}</span>
                  </div>
                </div>

                {/* Mobile Responsive Overrides for Hero */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                    Mobile Viewport Overrides
                  </span>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Mobile Heading Size</span>
                      <span className="font-mono">{config.theme.heroResponsive?.mobile?.titleSize || 24}px</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="48"
                      step="1"
                      value={config.theme.heroResponsive?.mobile?.titleSize || 24}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        pushConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            heroResponsive: {
                              ...config.theme.heroResponsive,
                              mobile: {
                                ...config.theme.heroResponsive?.mobile,
                                titleSize: val,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SECTION PROPERTIES */}
          {selectedEntity.type === 'section' && (() => {
            const sec = config.sectionsConfig.find((s) => s.id === selectedEntity.id);
            if (!sec) return null;
            return (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Section Content & Headers
                  </span>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Section Title</label>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const updated = config.sectionsConfig.map((s) =>
                          s.id === sec.id ? { ...s, title: e.target.value } : s
                        );
                        pushConfig({ ...config, sectionsConfig: updated });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Section Subtitle / Description</label>
                    <input
                      type="text"
                      value={sec.subtitle || ''}
                      onChange={(e) => {
                        const updated = config.sectionsConfig.map((s) =>
                          s.id === sec.id ? { ...s, subtitle: e.target.value } : s
                        );
                        pushConfig({ ...config, sectionsConfig: updated });
                      }}
                      placeholder="Optional section description subtitle"
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  {sec.id === 'about' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">About Text Narrative</label>
                      <textarea
                        rows={4}
                        value={config.aboutText}
                        onChange={(e) => pushConfig({ ...config, aboutText: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* Section Appearance */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Colors & Layout Dimensions
                  </span>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Section Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sec.bgColor || '#ffffff'}
                        onChange={(e) => {
                          const updated = config.sectionsConfig.map((s) =>
                            s.id === sec.id ? { ...s, bgColor: e.target.value } : s
                          );
                          pushConfig({ ...config, sectionsConfig: updated });
                        }}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={sec.bgColor || '#ffffff'}
                        onChange={(e) => {
                          const updated = config.sectionsConfig.map((s) =>
                            s.id === sec.id ? { ...s, bgColor: e.target.value } : s
                          );
                          pushConfig({ ...config, sectionsConfig: updated });
                        }}
                        className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Section Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={sec.textColor || '#0f172a'}
                        onChange={(e) => {
                          const updated = config.sectionsConfig.map((s) =>
                            s.id === sec.id ? { ...s, textColor: e.target.value } : s
                          );
                          pushConfig({ ...config, sectionsConfig: updated });
                        }}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={sec.textColor || '#0f172a'}
                        onChange={(e) => {
                          const updated = config.sectionsConfig.map((s) =>
                            s.id === sec.id ? { ...s, textColor: e.target.value } : s
                          );
                          pushConfig({ ...config, sectionsConfig: updated });
                        }}
                        className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Vertical Padding Y</span>
                      <span className="font-mono">{sec.paddingY || 64}px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="140"
                      step="4"
                      value={sec.paddingY || 64}
                      onChange={(e) => {
                        const updated = config.sectionsConfig.map((s) =>
                          s.id === sec.id ? { ...s, paddingY: Number(e.target.value) } : s
                        );
                        pushConfig({ ...config, sectionsConfig: updated });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Card Styling inside Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Inner Cards Customization
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Card Background</label>
                        <div className="flex items-center gap-1.5 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <input
                            type="color"
                            value={sec.cardBg || '#f8fafc'}
                            onChange={(e) => {
                              const updated = config.sectionsConfig.map((s) =>
                                s.id === sec.id ? { ...s, cardBg: e.target.value } : s
                              );
                              pushConfig({ ...config, sectionsConfig: updated });
                            }}
                            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[10px] font-mono">{sec.cardBg || '#f8fafc'}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Card Border</label>
                        <div className="flex items-center gap-1.5 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <input
                            type="color"
                            value={sec.cardBorder || '#e2e8f0'}
                            onChange={(e) => {
                              const updated = config.sectionsConfig.map((s) =>
                                s.id === sec.id ? { ...s, cardBorder: e.target.value } : s
                              );
                              pushConfig({ ...config, sectionsConfig: updated });
                            }}
                            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[10px] font-mono">{sec.cardBorder || '#e2e8f0'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Card Border Radius</span>
                        <span className="font-mono">{sec.cardRadius ?? 12}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="2"
                        value={sec.cardRadius ?? 12}
                        onChange={(e) => {
                          const updated = config.sectionsConfig.map((s) =>
                            s.id === sec.id ? { ...s, cardRadius: Number(e.target.value) } : s
                          );
                          pushConfig({ ...config, sectionsConfig: updated });
                        }}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Visibility & Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Section Visible</span>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sec.id)}
                      className="p-1 rounded text-blue-600"
                    >
                      {sec.isVisible ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => duplicateSection(sec.id)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate Section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSection(sec.id)}
                    className="w-full px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-red-600 text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Section from Layout</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 5. FOOTER PROPERTIES */}
          {selectedEntity.type === 'footer' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Footer Background & Styling
                </span>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Footer Background Color</label>
                  <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <input
                      type="color"
                      value={config.theme.footerBgColor || '#0f172a'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, footerBgColor: e.target.value } })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{config.theme.footerBgColor || '#0f172a'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Footer Text Color</label>
                  <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <input
                      type="color"
                      value={config.theme.footerTextColor || '#94a3b8'}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, footerTextColor: e.target.value } })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{config.theme.footerTextColor || '#94a3b8'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono">{config.theme.footerFontSize || 12}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="18"
                      step="1"
                      value={config.theme.footerFontSize || 12}
                      onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, footerFontSize: Number(e.target.value) } })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Top Border Color</label>
                    <div className="flex items-center gap-1.5 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <input
                        type="color"
                        value={config.theme.footerBorderTopColor || '#1e293b'}
                        onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, footerBorderTopColor: e.target.value } })}
                        className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-[10px] font-mono">{config.theme.footerBorderTopColor || '#1e293b'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Footer Information & Coordinates
                </span>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Copyright Statement</label>
                  <input
                    type="text"
                    value={config.footerText}
                    onChange={(e) => pushConfig({ ...config, footerText: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={config.contactEmail}
                    onChange={(e) => pushConfig({ ...config, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={config.contactPhone}
                    onChange={(e) => pushConfig({ ...config, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Venue Address</label>
                  <input
                    type="text"
                    value={config.address}
                    onChange={(e) => pushConfig({ ...config, address: e.target.value })}
                    placeholder="Grand Convention Center, Hall B"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. CANVAS THEME DEFAULT */}
          {selectedEntity.type === 'canvas' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Theme Accent Color</label>
                <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <input
                    type="color"
                    value={config.theme.primaryColor || '#2563eb'}
                    onChange={(e) => pushConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono">{config.theme.primaryColor || '#2563eb'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold block mb-1">Canvas Selection Help</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Click on any specific block on the canvas (Header, Hero, Elements, Sections, Footer) to inspect and edit its properties.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ADD SECTION MODAL */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Section Block to Website</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Custom Visual Section Layouts
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBlankCustomSection('stack')}
                    className="p-3 border rounded-xl hover:border-blue-500 text-left hover:shadow-xs bg-slate-50 dark:bg-slate-800"
                  >
                    <div className="font-bold text-xs text-blue-600">Blank Custom Section</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Freeform layout with heading & CTA button</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlankCustomSection('columns-2')}
                    className="p-3 border rounded-xl hover:border-blue-500 text-left hover:shadow-xs bg-slate-50 dark:bg-slate-800"
                  >
                    <div className="font-bold text-xs text-indigo-600">Two-Column Split Section</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Side-by-side card containers</div>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Standard Event Modules
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'agenda', title: 'Schedule Agenda' },
                    { id: 'speakers', title: 'Speakers Faculty' },
                    { id: 'tickets', title: 'Passes & Tickets' },
                    { id: 'sponsors', title: 'Partners & Sponsors' },
                    { id: 'contact', title: 'Venue Coordinates' },
                    { id: 'faq', title: 'Frequently Asked Questions' },
                    { id: 'countdown', title: 'Opening Countdown' },
                    { id: 'exhibitors', title: 'Exhibitor Directory' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        handleAddSection(m);
                        setShowAddSectionModal(false);
                      }}
                      className="p-2 border rounded-xl hover:border-blue-500 text-left text-xs font-semibold bg-white dark:bg-slate-800"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
