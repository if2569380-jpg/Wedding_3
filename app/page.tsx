'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Heart, Calendar, MapPin, Camera, Music, Timer, ChevronDown, Images, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ShiftingCountdown from '@/components/ui/countdown-timer';
import GuestMusic from '@/components/GuestMusic';
import PhotoCollageSection, { type PolaroidItem } from '@/components/PhotoCollageSection';
import { HERO_IMAGE_URL } from '@/lib/heroImage';
import { useIsMobile } from '@/hooks/use-mobile';
import { FALLBACK_STORY_CARDS, type AccentToken, type BackgroundToken, type IconToken, type SectionType, type TextToken } from '@/lib/landingContent';

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const GALLERY_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_GALLERY_BUCKET || 'gallery';
const LANDING_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LANDING_BUCKET || 'landing-public';

function getPublicStorageUrl(path: string) {
  if (!SUPABASE_PUBLIC_URL || !path) return '';
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/${GALLERY_BUCKET}/${path}`;
}

function getLandingPublicStorageUrl(path: string) {
  if (!SUPABASE_PUBLIC_URL || !path) return '';
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/${LANDING_BUCKET}/${path}`;
}

function FloralDivider() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      {/* Simple straight bottom edge */}
      <div className="h-0 bg-transparent" />
      
      {/* Minimal line divider with dots */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3">
        <div className="w-24 h-px bg-white/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        <div className="w-2 h-2 rounded-full bg-white/80" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        <div className="w-24 h-px bg-white/40" />
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <ChevronDown className="w-5 h-5 text-white/50 animate-bounce" />
      </div>
    </div>
  );
}

// Navigation Component with Glassmorphism & Scroll Spy
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Scroll spy - determine active section
      const sections = ['about', 'services', 'portfolio', 'contact'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'ABOUT', href: '#about', id: 'about' },
    { label: 'SERVICES', href: '#services', id: 'services' },
    { label: 'PORTFOLIO', href: '#portfolio', id: 'portfolio' },
    { label: 'CONTACT', href: '#contact', id: 'contact' },
  ];

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/92 backdrop-blur-xl shadow-xl shadow-black/10 border-b border-stone-300/70' 
            : 'bg-transparent'
        }`}
      >
        <div className="safe-container px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            {/* Left nav items */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.slice(0, 2).map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={`relative text-[11px] tracking-[0.14em] font-sans font-semibold transition-colors hover:text-rose-500 ${
                    scrolled ? 'text-stone-700' : 'text-white/95'
                  } ${activeSection === item.id ? 'text-rose-500' : ''}`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute -bottom-1 left-0 right-0 h-[2px] ${scrolled ? 'bg-rose-500' : 'bg-white/80'}`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Logo */}
            <Link href="/" className="flex-shrink min-w-0">
              <motion.h1 
                className={`text-xl sm:text-3xl truncate font-medium italic tracking-normal transition-colors ${
                  scrolled ? 'text-stone-800' : 'text-white'
                }`} 
                style={{ 
                  fontFamily: "'Dancing Script', 'Great Vibes', 'Pacifico', cursive", 
                  textShadow: scrolled ? 'none' : '0 2px 10px rgba(0,0,0,0.3)' 
                }}
                whileHover={{ scale: 1.02 }}
              >
                Laboni <span className="text-rose-400 mx-1">&</span> Arif
              </motion.h1>
            </Link>

            {/* Right nav items */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.slice(2).map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={`relative text-[11px] tracking-[0.14em] font-sans font-semibold transition-colors hover:text-rose-500 ${
                    scrolled ? 'text-stone-700' : 'text-white/95'
                  } ${activeSection === item.id ? 'text-rose-500' : ''}`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute -bottom-1 left-0 right-0 h-[2px] ${scrolled ? 'bg-rose-500' : 'bg-white/80'}`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-menu"
              className={`md:hidden p-2.5 rounded-full border min-h-11 min-w-11 transition-colors ${
                scrolled ? 'text-stone-800 border-stone-300 bg-white/80' : 'text-white border-white/45 bg-black/15'
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-xl pt-20 px-6 md:hidden"
          >
            <div className="flex flex-col items-center gap-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={`w-full max-w-xs py-3.5 text-sm tracking-[0.14em] font-sans font-semibold transition-colors border-b border-stone-200/80 hover:text-rose-500 ${
                    activeSection === item.id ? 'text-rose-500' : 'text-stone-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface LandingStorySection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_path: string;
  image_alt: string;
  image_url?: string;
  section_type: SectionType;
  countdown_target: string | null;
  icon_token: IconToken;
  background_token: BackgroundToken;
  text_token: TextToken;
  accent_token: AccentToken;
  order_index: number;
  is_active: boolean;
}

interface LandingCollageSection {
  id: string;
  caption: string;
  image_path: string;
  image_alt: string;
  image_url?: string;
  order_index: number;
  is_active: boolean;
}

const FALLBACK_WEDDING_SECTIONS: LandingStorySection[] = FALLBACK_STORY_CARDS.map((item, index) => ({
  id: `fallback-story-${index + 1}`,
  title: item.title,
  subtitle: item.subtitle,
  description: item.description,
  image_path: item.image_path,
  image_alt: item.image_alt,
  section_type: item.section_type,
  countdown_target: item.countdown_target,
  icon_token: item.icon_token,
  background_token: item.background_token,
  text_token: item.text_token,
  accent_token: item.accent_token,
  order_index: index,
  is_active: true,
}));

const STORY_BACKGROUND_CLASS_MAP: Record<BackgroundToken, string> = {
  ivory: 'bg-[#fdfcf8]',
  sand: 'bg-[#f5f2ed]',
  taupe: 'bg-[#ece8e1]',
  olive: 'bg-[#5a5a40]',
  charcoal: 'bg-[#3f3f2f]',
};

const STORY_TEXT_CLASS_MAP: Record<TextToken, string> = {
  stone_dark: 'text-stone-800',
  stone_light: 'text-stone-100',
};

const ACCENT_ICON_CLASS_MAP: Record<AccentToken, string> = {
  rose: 'text-rose-300',
  amber: 'text-amber-300',
  stone: 'text-stone-300',
  blue: 'text-blue-300',
  emerald: 'text-emerald-300',
};

function renderStoryIcon(token: IconToken, className: string) {
  if (token === 'heart') return <Heart className={className} />;
  if (token === 'calendar') return <Calendar className={className} />;
  if (token === 'music') return <Music className={className} />;
  if (token === 'timer') return <Timer className={className} />;
  if (token === 'camera') return <Camera className={className} />;
  if (token === 'map_pin') return <MapPin className={className} />;
  return <Sparkles className={className} />;
}

const STORY_SECTION_ANCHORS: Record<number, string> = {
  0: 'about',
  1: 'services',
  2: 'portfolio',
};

function getNextNovemberFirstTarget(): string {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentYearTargetMs = Date.UTC(currentYear, 10, 1, 0, 0, 0, 0);
  const nextTargetMs =
    now.getTime() >= currentYearTargetMs
      ? Date.UTC(currentYear + 1, 10, 1, 0, 0, 0, 0)
      : currentYearTargetMs;

  return new Date(nextTargetMs).toISOString();
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 1" />
      <path d="m19 3-1 1" />
      <path d="m5 21 1-1" />
      <path d="m19 21-1-1" />
    </svg>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, isMobile ? 60 : 150]);
  const opacity = useTransform(scrollY, [0, isMobile ? 200 : 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, isMobile ? 1.04 : 1.1]);
  const countdownTargetDate = getNextNovemberFirstTarget();
  const [landingSignedImages, setLandingSignedImages] = useState<Record<string, string>>({});
  const [storySections, setStorySections] = useState<LandingStorySection[]>([]);
  const [collageSections, setCollageSections] = useState<LandingCollageSection[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadLandingContent = async () => {
      try {
        const response = await fetch('/api/landing-content');
        if (!response.ok) return;

        const payload = (await response.json()) as {
          storyCards?: LandingStorySection[];
          collageItems?: LandingCollageSection[];
        };

        if (!isMounted) return;

        const sortedStory = (payload.storyCards || [])
          .filter((item) => item.is_active !== false)
          .sort((a, b) => a.order_index - b.order_index);

        const sortedCollage = (payload.collageItems || [])
          .filter((item) => item.is_active !== false)
          .sort((a, b) => a.order_index - b.order_index);

        setStorySections(sortedStory);
        setCollageSections(sortedCollage);
      } catch {
        // Keep static fallback content.
      }
    };

    const loadLandingImages = async () => {
      try {
        const response = await fetch('/api/landing-images');
        if (!response.ok) return;

        const payload = await response.json() as { images?: Record<string, string> };
        if (!isMounted || !payload?.images) return;

        setLandingSignedImages(payload.images);
      } catch {
        // Keep public URL fallback when signing endpoint is unavailable.
      }
    };

    loadLandingContent();
    loadLandingImages();

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedStorySections = useMemo(() => {
    const source = storySections.length > 0 ? storySections : FALLBACK_WEDDING_SECTIONS;
    return source
      .filter((section) => section.is_active !== false)
      .sort((a, b) => a.order_index - b.order_index);
  }, [storySections]);

  const resolvedCollageItems = useMemo<PolaroidItem[] | undefined>(() => {
    if (collageSections.length === 0) return undefined;

    const items = collageSections
      .filter((item) => item.is_active !== false)
      .sort((a, b) => a.order_index - b.order_index)
      .map((item, index) => ({
        id: item.id || `collage-${index + 1}`,
        src: item.image_url || getLandingPublicStorageUrl(item.image_path) || HERO_IMAGE_URL,
        caption: item.caption,
        alt: item.image_alt || item.caption,
      }));

    return items.length > 0 ? items : undefined;
  }, [collageSections]);

  return (
    <main className="relative antialiased selection:bg-rose-100 selection:text-rose-900">
      {/* Hero Section with Parallax */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 z-0"
        >
          <motion.div 
            style={{ y: y1, scale }}
            className="absolute inset-0"
          >
            <Image 
              src={HERO_IMAGE_URL} 
              alt="Wedding couple" 
              fill 
              className="object-cover"
              priority
              referrerPolicy="no-referrer"
            />
          </motion.div>
          {/* Stronger Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 z-10" />
        </motion.div>

        <Navigation />

        {/* Hero Content with Parallax Fade */}
        <motion.div 
          style={{ opacity }}
          className="relative z-20 text-center px-4 sm:px-6 max-w-4xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-xs sm:text-sm uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white/90 font-sans font-semibold mb-5 sm:mb-6"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            Laboni & Adnan Arif
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-white leading-[1.08] tracking-tight"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
          >
            Turning Your Wedding Dreams
            <span className="block italic font-normal mt-2">Into Ultimate Reality</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-6 sm:mt-8 text-sm sm:text-lg text-white/95 font-sans font-normal tracking-[0.01em] max-w-xl mx-auto leading-relaxed"
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
          >
            Crafting every detail to shape your perfect wedding day with love and elegance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.45 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <Link
              href="#about"
              className="w-full sm:w-auto text-center px-7 sm:px-10 py-3.5 sm:py-4 bg-white text-stone-900 text-sm tracking-[0.08em] font-sans font-bold rounded-xl border border-white/80 hover:bg-stone-100 hover:scale-[1.03] transition-all duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            >
              EXPLORE OUR STORY
            </Link>
            <Link
              href="/gallery"
              className="w-full sm:w-auto text-center px-7 sm:px-10 py-3.5 sm:py-4 bg-white/20 backdrop-blur-md border border-white/60 text-white text-sm tracking-[0.08em] font-sans font-semibold rounded-xl hover:bg-white/28 hover:scale-[1.03] transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.2)]"
            >
              VIEW GALLERY
            </Link>
          </motion.div>
        </motion.div>

        <FloralDivider />
      </section>

      {/* Overlapping Album Sections */}
      <div className="relative">
        {resolvedStorySections.map((section, index) => (
          <section
            key={section.id}
            id={STORY_SECTION_ANCHORS[index] || `story-${index + 1}`}
            className={`md:sticky md:top-0 scroll-mt-24 min-h-[88svh] md:h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-12 ${
              STORY_BACKGROUND_CLASS_MAP[section.background_token] || STORY_BACKGROUND_CLASS_MAP.ivory
            } ${STORY_TEXT_CLASS_MAP[section.text_token] || STORY_TEXT_CLASS_MAP.stone_dark} shadow-[0_-20px_50px_rgba(0,0,0,0.05)]`}
            style={{ 
              zIndex: index + 1,
            }}
          >
            <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="order-2 md:order-1 mobile-motion-soft"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-10 h-10 rounded-full bg-stone-200/80 border border-stone-300/70 flex items-center justify-center">
                    {renderStoryIcon(section.icon_token, `w-6 h-6 ${ACCENT_ICON_CLASS_MAP[section.accent_token]}`)}
                  </div>
                  <span className="text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.14em] font-sans font-semibold opacity-75">
                    {section.subtitle}
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-normal mb-5 sm:mb-8 leading-tight">
                  {section.title}
                </h2>
                <p className="text-base sm:text-lg md:text-xl font-serif leading-relaxed opacity-80 max-w-md">
                  {section.description}
                </p>
                
                {section.section_type === 'countdown' ? (
                  <ShiftingCountdown targetDate={section.countdown_target || countdownTargetDate} />
                ) : (
                  <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-[0.08em] font-sans opacity-55">Location</span>
                      <span className="text-sm font-sans font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Tuscany, Italy
                      </span>
                    </div>
                    <div className="w-px h-8 bg-stone-300/30" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-[0.08em] font-sans opacity-55">Photographer</span>
                      <span className="text-sm font-sans font-medium flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Elena Rossi
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, rotate: index % 2 === 0 ? -2 : 2 }}
                whileInView={{ opacity: 1, scale: 1, rotate: index % 2 === 0 ? -1 : 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="order-1 md:order-2 relative aspect-[4/5] sm:aspect-[3/4] md:aspect-auto md:h-[70vh] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-8 sm:border-[12px] border-white mobile-motion-soft"
              >
                <Image 
                  src={
                    section.image_url
                    || landingSignedImages[section.image_path]
                    || getLandingPublicStorageUrl(section.image_path)
                    || getPublicStorageUrl(section.image_path)
                    || getPublicStorageUrl(section.image_path.replace(/^full\//, 'thumbnails/'))
                    || HERO_IMAGE_URL
                  }
                  alt={section.image_alt || section.title} 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </motion.div>
            </div>
          </section>
        ))}
      </div>

      {/* Photo Collage Section */}
      <PhotoCollageSection items={resolvedCollageItems} />

      {/* Final Section */}
      <section id="contact" className="scroll-mt-24 min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] via-[#252525] to-[#1a1a1a] text-white px-4 sm:px-8 py-12 sm:py-10 text-center relative z-50 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="max-w-3xl relative z-10 mobile-motion-soft"
        >
          {/* Decorative line above */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-20 sm:w-24 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent mx-auto mb-9 sm:mb-12"
          />
          
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-normal mb-4 sm:mb-6 tracking-tight">
            To be continued
            <span className="text-rose-400">...</span>
          </h2>
          
          <p className="text-stone-400 font-serif italic text-lg sm:text-xl mb-4">
            &quot;And so the adventure begins.&quot;
          </p>
          
          {/* Names */}
          <p className="text-xl sm:text-3xl font-medium italic mb-9 sm:mb-12" style={{ fontFamily: "'Dancing Script', cursive" }}>
            Laboni & Adnan Arif
          </p>
          
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-9 sm:mb-12">
            <div className="w-16 h-px bg-stone-700" />
            <Heart className="w-5 h-5 text-rose-400/60" />
            <div className="w-16 h-px bg-stone-700" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 border border-stone-500 rounded-xl font-sans text-sm uppercase tracking-[0.08em] font-semibold hover:bg-white hover:text-stone-900 hover:border-white transition-all duration-500"
            >
              Replay Story
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/gallery"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl font-sans text-sm uppercase tracking-[0.08em] font-semibold hover:from-rose-400 hover:to-rose-500 transition-all duration-500 shadow-[0_10px_30px_rgba(225,29,72,0.35)]"
              >
                <Images className="w-5 h-5" />
                View Gallery
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Bottom decorative heart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute bottom-12 left-0 right-0 flex justify-center"
        >
          <Heart className="w-6 h-6 text-rose-400/30" fill="currentColor" />
        </motion.div>
        
        {/* Copyright */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-stone-600 font-sans tracking-wider">Made with love • 2025</p>
        </div>
      </section>
      <GuestMusic />
    </main>
  );
}
