export interface CertificateTemplatePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  theme: {
    fontFamily: 'serif' | 'sans' | 'mono' | 'display';
    borderStyle: 'double_gold' | 'geometric' | 'ornate' | 'minimal' | 'vintage' | 'modern_line' | 'dark_foil' | 'clean_boxed';
    bgType: 'solid' | 'gradient' | 'parchment' | 'dark' | 'mesh';
    bgColor: string;
    bgGradient?: string;
    textColor: string;
    titleColor: string;
    accentColor: string;
    borderColor: string;
    sealType: 'gold_crest' | 'star_ribbon' | 'laurel_wreath' | 'shield_check' | 'wax_seal' | 'none';
    sealColor: string;
    qrPosition: 'bottom_right' | 'bottom_left' | 'bottom_center';
  };
  defaults: {
    title: string;
    bodyText: string;
    signatoryName: string;
    signatoryTitle: string;
    criteriaType: 'check_in' | 'session_count' | 'manual';
    minSessionCount: number;
  };
}

export const CERTIFICATE_PRESETS: CertificateTemplatePreset[] = [
  {
    id: 'classic_gold',
    name: 'Classic Gold Executive',
    category: 'Corporate & Executive',
    description: 'Timeless formal certificate with polished gold borders, regal serif typography, and a prestigious laurel seal.',
    theme: {
      fontFamily: 'serif',
      borderStyle: 'double_gold',
      bgType: 'solid',
      bgColor: '#ffffff',
      textColor: '#334155',
      titleColor: '#b45309',
      accentColor: '#d97706',
      borderColor: '#d97706',
      sealType: 'gold_crest',
      sealColor: '#d97706',
      qrPosition: 'bottom_right',
    },
    defaults: {
      title: 'Certificate of Excellence',
      bodyText: 'This is to certify that {{name}} has demonstrated exceptional leadership and actively participated in all executive proceedings.',
      signatoryName: 'Dr. Arthur Pendelton',
      signatoryTitle: 'Executive Chairman & Convener',
      criteriaType: 'check_in',
      minSessionCount: 1,
    },
  },
  {
    id: 'modern_tech',
    name: 'Modern Tech Minimalist',
    category: 'Technology & Dev',
    description: 'Clean developer aesthetic with cyber cyan accents, geometric corner guides, and high-tech typography.',
    theme: {
      fontFamily: 'mono',
      borderStyle: 'geometric',
      bgType: 'dark',
      bgColor: '#090d16',
      bgGradient: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
      textColor: '#94a3b8',
      titleColor: '#38bdf8',
      accentColor: '#0ea5e9',
      borderColor: '#0284c7',
      sealType: 'shield_check',
      sealColor: '#38bdf8',
      qrPosition: 'bottom_right',
    },
    defaults: {
      title: 'Certified Systems Architect',
      bodyText: 'This credential validates that {{name}} has mastered distributed cloud architectures and engineering methodologies.',
      signatoryName: 'Alex Chen',
      signatoryTitle: 'Principal Cloud Fellow',
      criteriaType: 'session_count',
      minSessionCount: 3,
    },
  },
  {
    id: 'academic_excellence',
    name: 'Academic Distinction',
    category: 'Education & Research',
    description: 'Collegiate ivy-league heritage style with deep navy, crimson embellishments, and academic script accents.',
    theme: {
      fontFamily: 'serif',
      borderStyle: 'ornate',
      bgType: 'parchment',
      bgColor: '#fcfbf7',
      textColor: '#1e293b',
      titleColor: '#1e3a8a',
      accentColor: '#991b1b',
      borderColor: '#1e3a8a',
      sealType: 'laurel_wreath',
      sealColor: '#991b1b',
      qrPosition: 'bottom_left',
    },
    defaults: {
      title: 'Certificate of Scholarly Achievement',
      bodyText: 'Presented to {{name}} in recognition of outstanding academic research presentation and peer-reviewed symposium contributions.',
      signatoryName: 'Prof. Margaret Sterling, PhD',
      signatoryTitle: 'Dean of Academic Faculty',
      criteriaType: 'check_in',
      minSessionCount: 1,
    },
  },
  {
    id: 'creative_vibrant',
    name: 'Creative Vibrant Diploma',
    category: 'Design & Creative',
    description: 'Contemporary design certificate featuring vivid magenta-rose gradient halos, sleek sans-serif, and playful energy.',
    theme: {
      fontFamily: 'sans',
      borderStyle: 'modern_line',
      bgType: 'gradient',
      bgColor: '#ffffff',
      bgGradient: 'linear-gradient(135deg, #ffffff 0%, #fdf4ff 50%, #f5f3ff 100%)',
      textColor: '#475569',
      titleColor: '#a855f7',
      accentColor: '#ec4899',
      borderColor: '#c084fc',
      sealType: 'star_ribbon',
      sealColor: '#ec4899',
      qrPosition: 'bottom_right',
    },
    defaults: {
      title: 'Certificate of Creative Distinction',
      bodyText: 'Awarded to {{name}} for showcasing innovative interactive design craft and visionary creative expression.',
      signatoryName: 'Sienna Blake',
      signatoryTitle: 'Head of Visual Innovation',
      criteriaType: 'check_in',
      minSessionCount: 1,
    },
  },
  {
    id: 'dark_luxury',
    name: 'Elegant Dark Luxury',
    category: 'Luxury & VIP',
    description: 'Midnight black velvet aesthetic with brushed champagne gold foil accents and ultra-refined spacing.',
    theme: {
      fontFamily: 'display',
      borderStyle: 'dark_foil',
      bgType: 'dark',
      bgColor: '#050505',
      bgGradient: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
      textColor: '#d4d4d8',
      titleColor: '#fbbf24',
      accentColor: '#f59e0b',
      borderColor: '#d97706',
      sealType: 'gold_crest',
      sealColor: '#fbbf24',
      qrPosition: 'bottom_center',
    },
    defaults: {
      title: 'Honorary Fellow & Luminary',
      bodyText: 'Conferred upon {{name}} for distinguished global industry contributions, visionary stewardship, and honorary excellence.',
      signatoryName: 'Lord Julian Sterling',
      signatoryTitle: 'President of the Global Advisory Council',
      criteriaType: 'manual',
      minSessionCount: 1,
    },
  },
  {
    id: 'corporate_leadership',
    name: 'Enterprise Leadership',
    category: 'Business & Management',
    description: 'Executive corporate styling with slate teal frames, structured signature blocks, and corporate governance motifs.',
    theme: {
      fontFamily: 'sans',
      borderStyle: 'clean_boxed',
      bgType: 'solid',
      bgColor: '#f8fafc',
      textColor: '#334155',
      titleColor: '#0f766e',
      accentColor: '#0d9488',
      borderColor: '#0f766e',
      sealType: 'shield_check',
      sealColor: '#0f766e',
      qrPosition: 'bottom_right',
    },
    defaults: {
      title: 'Executive Leadership Credential',
      bodyText: 'Certifying that {{name}} has successfully completed the Global Strategy, Enterprise Transformation, and C-Suite Governance program.',
      signatoryName: 'Elena Rostova',
      signatoryTitle: 'Managing Director, Enterprise Institute',
      criteriaType: 'check_in',
      minSessionCount: 1,
    },
  },
  {
    id: 'medical_healthcare',
    name: 'Clinical & Healthcare Distinction',
    category: 'Healthcare & Science',
    description: 'Professional medical aesthetics with sterile cyan-teal borders, clinical precision layout, and CME accreditation tags.',
    theme: {
      fontFamily: 'serif',
      borderStyle: 'double_gold',
      bgType: 'solid',
      bgColor: '#ffffff',
      textColor: '#1e293b',
      titleColor: '#0369a1',
      accentColor: '#0284c7',
      borderColor: '#0284c7',
      sealType: 'laurel_wreath',
      sealColor: '#0369a1',
      qrPosition: 'bottom_left',
    },
    defaults: {
      title: 'Certificate of Medical Continuing Education',
      bodyText: 'This validates that Dr. {{name}} has completed 16 credit hours of specialized clinical masterclasses and symposium roundtables.',
      signatoryName: 'Dr. Vivek Sharma, MD, FRCS',
      signatoryTitle: 'Chair, Medical Accreditation Board',
      criteriaType: 'check_in',
      minSessionCount: 2,
    },
  },
  {
    id: 'clean_monochrome',
    name: 'Timeless Swiss Monochrome',
    category: 'Minimal & Editorial',
    description: 'High-contrast monochrome Swiss typography with razor-sharp rules, high legibility, and architectural beauty.',
    theme: {
      fontFamily: 'sans',
      borderStyle: 'minimal',
      bgType: 'solid',
      bgColor: '#ffffff',
      textColor: '#0f172a',
      titleColor: '#020617',
      accentColor: '#334155',
      borderColor: '#0f172a',
      sealType: 'none',
      sealColor: '#0f172a',
      qrPosition: 'bottom_right',
    },
    defaults: {
      title: 'Certificate of Participation',
      bodyText: 'Awarded to {{name}} in acknowledgment of dedicated participation, dialogue, and project exhibition at the international design symposium.',
      signatoryName: 'Klaus Mueller',
      signatoryTitle: 'Lead Curator, International Design Forum',
      criteriaType: 'check_in',
      minSessionCount: 1,
    },
  },
  {
    id: 'gradient_badge',
    name: 'Modern Gradient Aura',
    category: 'Conferences & Summits',
    description: 'Sunset violet-to-amber mesh background with a floating glass certificate placard, perfect for modern tech summits.',
    theme: {
      fontFamily: 'sans',
      borderStyle: 'modern_line',
      bgType: 'mesh',
      bgColor: '#ffffff',
      bgGradient: 'radial-gradient(circle at 10% 20%, #fdf2f8 0%, #eff6ff 90%)',
      textColor: '#334155',
      titleColor: '#4338ca',
      accentColor: '#6366f1',
      borderColor: '#818cf8',
      sealType: 'star_ribbon',
      sealColor: '#6366f1',
      qrPosition: 'bottom_right',
    },
    defaults: {
      title: 'Official Summit Delegate Certificate',
      bodyText: 'Proudly issued to {{name}} for attending keynote symposiums, participating in breakout labs, and driving ecosystem innovation.',
      signatoryName: 'Devon Park',
      signatoryTitle: 'Global Conference Organizer',
      criteriaType: 'check_in',
      minSessionCount: 1,
    },
  },
  {
    id: 'traditional_parchment',
    name: 'Heritage Parchment Scroll',
    category: 'Honorary & Societies',
    description: 'Vintage antiqued parchment paper background with ornate hand-engraved border flourishes and wax seal motif.',
    theme: {
      fontFamily: 'serif',
      borderStyle: 'vintage',
      bgType: 'parchment',
      bgColor: '#fbf8ee',
      textColor: '#451a03',
      titleColor: '#78350f',
      accentColor: '#92400e',
      borderColor: '#78350f',
      sealType: 'wax_seal',
      sealColor: '#991b1b',
      qrPosition: 'bottom_center',
    },
    defaults: {
      title: 'Conferral of Society Fellowship',
      bodyText: 'Be it known that {{name}} has been duly inducted as a Fellow of the Royal Society, with all honors, privileges, and duties pertaining thereto.',
      signatoryName: 'Sir Reginald Thornton',
      signatoryTitle: 'Chancellor of the Society',
      criteriaType: 'manual',
      minSessionCount: 1,
    },
  },
];
