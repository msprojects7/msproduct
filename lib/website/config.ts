/**
 * MS Backstage — Comprehensive Website Builder Model, Design Tokens, & Element System
 *
 * Provides element-level modeling, responsive typography, visual layout configurations,
 * and unified persistence for the visual editor and public website.
 */

export interface ElementBreakpointOverrides {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  hidden?: boolean;
  padding?: number;
}

export interface HeroBreakpointOverrides {
  titleSize?: number;
  subtitleSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  buttonLayout?: 'row' | 'stack';
  paddingY?: number;
  hideSubtitle?: boolean;
}

export interface WebsiteElement {
  id: string;
  type: 'text' | 'button' | 'image' | 'card' | 'badge' | 'divider';
  x: number; // percentage 0-100 across section width
  y: number; // percentage 0-100 across section height or relative layout
  width: number; // percentage (e.g. 100 for full row, 50 for half, or custom)
  height: number; // px or relative height
  zIndex?: number;
  locked?: boolean;
  opacity?: number;

  // Responsive Breakpoint Overrides (Cascading: Desktop -> Tablet -> Mobile)
  tablet?: ElementBreakpointOverrides;
  mobile?: ElementBreakpointOverrides;

  // Text specific
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

  // Button specific
  buttonText?: string;
  buttonLink?: string;
  buttonVariant?: 'solid' | 'outline' | 'ghost' | 'gradient';
  buttonBg?: string;
  buttonTextColor?: string;
  buttonRadius?: number;
  buttonPaddingX?: number;
  buttonPaddingY?: number;
  buttonShadow?: string;
  buttonIcon?: 'ticket' | 'arrow' | 'calendar' | 'sparkles' | 'none';

  // Image specific
  imageUrl?: string;
  altText?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  imageRadius?: number;
  imageBorder?: string;
  imageShadow?: string;

  // Card / Container specific
  cardBg?: string;
  cardBorder?: string;
  cardRadius?: number;
  cardShadow?: string;
  cardPadding?: number;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'about' | 'tickets' | 'speakers' | 'agenda' | 'sponsors' | 'exhibitors' | 'faq' | 'contact' | 'countdown' | 'custom' | 'cta' | 'gallery' | string;
  isVisible: boolean;
  displayOrder: number;
  layout?: 'stack' | 'grid' | 'columns-2' | 'columns-3' | 'freeform';
  bgType?: 'color' | 'gradient' | 'image';
  bgColor?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  bgOverlayOpacity?: number;
  textColor?: string;
  paddingY?: number;
  cardBg?: string;
  cardBorder?: string;
  cardRadius?: number;
  cardShadow?: string;
  elements?: WebsiteElement[];
}

export interface WebsiteAsset {
  id: string;
  name: string;
  url: string;
  category: 'logo' | 'hero' | 'section' | 'background';
  size?: string;
  uploadedAt: string;
}

export interface WebsitePageItem {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  isHome: boolean;
  isPublished: boolean;
  navOrder: number;
  sections?: string[];
  customHeadline?: string;
  customDescription?: string;
}

export interface WebsiteThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  templateId?: string;
  fontFamily?: string;
  fontHeading?: 'inter' | 'playfair' | 'plus_jakarta' | 'space_grotesk' | 'cinzel' | 'outfit' | string;
  fontBody?: 'inter' | 'roboto' | 'sans' | 'serif' | string;

  // Header design
  headerBgColor?: string;
  headerBgGradient?: string;
  headerTextColor?: string;
  headerNavHoverColor?: string;
  headerNavFontSize?: number;
  headerNavFontFamily?: string;
  headerNavSpacing?: number;
  headerHeight?: number;
  headerPaddingX?: number;
  headerPaddingY?: number;
  headerBorderColor?: string;
  headerBorderWidth?: number;
  headerShadow?: string;
  headerSticky?: boolean;
  headerTransparent?: boolean;
  headerShowTitle?: boolean;
  headerTitleText?: string;
  headerAlignment?: 'left' | 'center' | 'between';
  headerTitleFontSize?: number;
  headerTitleFontFamily?: string;
  headerTitleFontWeight?: string;
  headerTitleColor?: string;
  headerLogoWidth?: number;
  headerLogoHeight?: number;
  headerLogoFit?: 'contain' | 'cover';
  headerBorderBottom?: boolean;
  headerCtaText?: string;
  headerCtaLink?: string;
  headerCtaBg?: string;
  headerCtaTextColor?: string;
  headerCtaBorderRadius?: string;

  // Hero controls
  heroEyebrow?: string;
  heroLayout?: 'split' | 'centered' | 'minimal' | 'bold_banner' | 'immersive';
  heroAlignment?: 'left' | 'center' | 'right';
  heroBgColor?: string;
  heroTextColor?: string;
  heroSubtextColor?: string;
  heroTitleFontFamily?: string;
  heroTitleFontSize?: number;
  heroTitleFontWeight?: string;
  heroTitleColor?: string;
  heroSubtitleFontFamily?: string;
  heroSubtitleFontSize?: number;
  heroSubtitleColor?: string;
  heroHideOverlay?: boolean;
  heroOverlayOpacity?: number;
  heroOverlayColor?: string;
  heroMinHeight?: number;
  heroPaddingY?: number;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaButtonBg?: string;
  ctaButtonTextColor?: string;
  ctaButtonFontSize?: number;
  ctaButtonBorderRadius?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonBg?: string;
  secondaryButtonTextColor?: string;
  secondaryButtonBorderColor?: string;
  secondaryButtonBorderRadius?: string;
  heroResponsive?: {
    tablet?: HeroBreakpointOverrides;
    mobile?: HeroBreakpointOverrides;
  };
  headerResponsive?: {
    mobileMenuOpen?: boolean;
    logoAlignment?: 'left' | 'center';
  };

  // Card & Container styles
  cardStyle?: 'glass' | 'bordered' | 'solid' | 'flat';
  cardBgColor?: string;
  cardTextColor?: string;
  cardBorderColor?: string;
  cardBorderRadius?: number;
  cardShadow?: string;

  // Global Page & Site styling
  siteBgColor?: string;
  siteTextColor?: string;
  gradientStyle?: 'linear' | 'radial' | 'mesh';

  // Button styles
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: string;
  buttonFontFamily?: string;
  buttonFontSize?: number;
  buttonPadding?: string;
  buttonHoverBg?: string;

  // Footer design
  footerBgColor?: string;
  footerTextColor?: string;
  footerBorderTop?: boolean;
  footerBorderTopColor?: string;
  footerFontSize?: number;
  footerShowSocial?: boolean;
  footerShowNav?: boolean;

  // Sub-entities
  orgLogoUrl?: string;
  eventLogoUrl?: string;
  pages?: WebsitePageItem[];
  assets?: WebsiteAsset[];
  customElements?: Record<string, WebsiteElement[]>; // keyed by sectionId
}

export interface WebsiteConfig {
  isPublished: boolean;
  theme: WebsiteThemeConfig;
  heroTitle: string;
  heroSubtitle: string;
  heroCoverUrl: string;
  logoUrl: string;
  aboutText: string;
  sectionsConfig: CustomSectionItem[];
  contactEmail: string;
  contactPhone: string;
  address: string;
  footerText: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    instagram?: string;
  };
  seoTitle: string;
  seoDescription: string;
}

export const WEBSITE_FONTS = [
  { id: 'inter', name: 'Inter', category: 'Clean Modern Sans', family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'plus_jakarta', name: 'Plus Jakarta Sans', category: 'Executive Enterprise', family: '"Plus Jakarta Sans", sans-serif' },
  { id: 'playfair', name: 'Playfair Display', category: 'Academic & Luxury Serif', family: '"Playfair Display", Georgia, serif' },
  { id: 'times_new_roman', name: 'Times New Roman', category: 'Classic Editorial Serif', family: '"Times New Roman", Times, Georgia, serif' },
  { id: 'outfit', name: 'Outfit', category: 'Futuristic Tech Sans', family: 'Outfit, system-ui, sans-serif' },
  { id: 'space_grotesk', name: 'Space Grotesk', category: 'Cyberpunk & Developer', family: '"Space Grotesk", monospace, sans-serif' },
  { id: 'cinzel', name: 'Cinzel Decorative', category: 'Classical Dignified', family: '"Cinzel", "Times New Roman", serif' },
  { id: 'montserrat', name: 'Montserrat', category: 'Bold Geometric Sans', family: 'Montserrat, "Segoe UI", sans-serif' },
  { id: 'poppins', name: 'Poppins', category: 'Friendly Geometric Rounded', family: 'Poppins, -apple-system, sans-serif' },
  { id: 'roboto', name: 'Roboto', category: 'Standard Clean Sans', family: 'Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: 'jetbrains_mono', name: 'JetBrains Mono', category: 'Technical Monospace', family: '"JetBrains Mono", Consolas, monospace' },
];

export function getFontFamilyCss(id?: string): string {
  const match = WEBSITE_FONTS.find((f) => f.id === id);
  return match?.family || 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
}

/**
 * Creates sample elements for new blank or custom sections.
 */
export function createDefaultElementsForCustomSection(layout: 'stack' | 'grid' | 'columns-2' | 'columns-3' | 'freeform' = 'stack'): WebsiteElement[] {
  if (layout === 'columns-2') {
    return [
      {
        id: `el_col1_${Date.now()}`,
        type: 'card',
        x: 5,
        y: 10,
        width: 42,
        height: 240,
        cardBg: '#ffffff',
        cardBorder: '#e2e8f0',
        cardRadius: 16,
        cardPadding: 20,
      },
      {
        id: `el_txt1_${Date.now()}`,
        type: 'text',
        x: 8,
        y: 16,
        width: 36,
        height: 60,
        content: 'Innovation Track A',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
      },
      {
        id: `el_col2_${Date.now()}`,
        type: 'card',
        x: 53,
        y: 10,
        width: 42,
        height: 240,
        cardBg: '#ffffff',
        cardBorder: '#e2e8f0',
        cardRadius: 16,
        cardPadding: 20,
      },
      {
        id: `el_txt2_${Date.now()}`,
        type: 'text',
        x: 56,
        y: 16,
        width: 36,
        height: 60,
        content: 'Technical Workshops B',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
      },
    ];
  }

  // Default stack layout with heading, body, and button
  return [
    {
      id: `el_head_${Date.now()}`,
      type: 'text',
      x: 10,
      y: 10,
      width: 80,
      height: 48,
      content: 'Custom Feature Highlight',
      fontSize: 28,
      fontWeight: 'extrabold',
      textAlign: 'center',
      color: '#0f172a',
    },
    {
      id: `el_body_${Date.now()}`,
      type: 'text',
      x: 15,
      y: 35,
      width: 70,
      height: 64,
      content: 'Highlight exclusive tracks, partner exhibitions, workshop schedules, and VIP networking details for your attendees.',
      fontSize: 15,
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#475569',
      lineHeight: 1.6,
    },
    {
      id: `el_btn_${Date.now()}`,
      type: 'button',
      x: 35,
      y: 70,
      width: 30,
      height: 44,
      buttonText: 'Explore Opportunities',
      buttonLink: '#tickets',
      buttonVariant: 'solid',
      buttonBg: '#2563eb',
      buttonTextColor: '#ffffff',
      buttonRadius: 12,
      buttonIcon: 'arrow',
    },
  ];
}

/**
 * Resolves element properties with Wix Studio-style cascading breakpoint overrides:
 * Desktop (base) -> Tablet -> Mobile
 */
export function resolveElementProperty<K extends keyof ElementBreakpointOverrides>(
  element: WebsiteElement,
  prop: K,
  device: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): any {
  if (device === 'mobile') {
    return element.mobile?.[prop] ?? element.tablet?.[prop] ?? (element as any)[prop];
  }
  if (device === 'tablet') {
    return element.tablet?.[prop] ?? (element as any)[prop];
  }
  return (element as any)[prop];
}

