'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Heart, Calendar, MapPin, Camera, Music, Timer, ChevronDown, Images, Volume2, VolumeX, Play, Pause, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useSyncExternalStore, useRef, useCallback } from 'react';
import Link from 'next/link';
import ShiftingCountdown from '@/components/ui/countdown-timer';

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
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/85 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-stone-200/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left nav items */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.slice(0, 2).map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={`relative text-xs tracking-[0.2em] font-sans font-medium transition-colors hover:text-rose-500 ${
                    scrolled ? 'text-stone-600' : 'text-white/90'
                  } ${activeSection === item.id ? 'text-rose-500' : ''}`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute -bottom-1 left-0 right-0 h-0.5 ${scrolled ? 'bg-rose-500' : 'bg-white/70'}`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <motion.h1 
                className={`text-2xl sm:text-3xl font-light italic tracking-normal transition-colors ${
                  scrolled ? 'text-stone-800' : 'text-white'
                }`} 
                style={{ 
                  fontFamily: "'Dancing Script', 'Great Vibes', 'Pacifico', cursive", 
                  textShadow: scrolled ? 'none' : '0 2px 10px rgba(0,0,0,0.3)' 
                }}
                whileHover={{ scale: 1.02 }}
              >
                Suborna <span className="text-rose-400 mx-1">&</span> Hridoy
              </motion.h1>
            </Link>

            {/* Right nav items */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.slice(2).map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={`relative text-xs tracking-[0.2em] font-sans font-medium transition-colors hover:text-rose-500 ${
                    scrolled ? 'text-stone-600' : 'text-white/90'
                  } ${activeSection === item.id ? 'text-rose-500' : ''}`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute -bottom-1 left-0 right-0 h-0.5 ${scrolled ? 'bg-rose-500' : 'bg-white/70'}`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 transition-colors ${
                scrolled ? 'text-stone-800' : 'text-white'
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className={`text-sm tracking-[0.2em] font-sans font-medium transition-colors hover:text-rose-500 ${
                    activeSection === item.id ? 'text-rose-500' : 'text-stone-600'
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

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// Floating hearts component - client only
function FloatingHearts() {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  const [hearts, setHearts] = useState<Array<{ id: number; size: number; left: number; delay: number; duration: number }> | null>(null);

  useEffect(() => {
    if (!isClient || hearts) return;
    const generatedHearts = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: Math.random() * 16 + 12,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4,
    }));
    const id = setTimeout(() => setHearts(generatedHearts), 0);
    return () => clearTimeout(id);
  }, [isClient, hearts]);

  if (!hearts) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.left}%`,
            bottom: '-30px',
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: -800,
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: heart.duration,
            repeat: Infinity,
            delay: heart.delay,
            ease: 'easeOut',
          }}
        >
          <Heart
            className="text-rose-300/40"
            style={{ width: heart.size, height: heart.size }}
            fill="currentColor"
          />
        </motion.div>
      ))}
    </div>
  );
}

// Playlist loaded from public/music folder via API
type PlaylistItem = { name: string; src: string };

// Background music - playlist from public/music, song selection, auto-next when song ends
function BackgroundMusic() {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasMultiple = playlist.length > 1;

  // Fetch MP3 list from public/music folder
  useEffect(() => {
    if (!isClient) return;
    fetch('/api/music')
      .then((res) => res.json())
      .then((data: { files: PlaylistItem[] }) => {
        setPlaylist(data.files ?? []);
        setPlaylistLoading(false);
      })
      .catch(() => {
        setPlaylist([]);
        setPlaylistLoading(false);
      });
  }, [isClient]);

  const playNext = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const lastLoadedIndexRef = useRef(-1);

  useEffect(() => {
    if (!isClient || playlist.length === 0) return;
    const audio = new Audio(playlist[0].src);
    audioRef.current = audio;
    lastLoadedIndexRef.current = 0;
    audio.volume = volume; // updated by next effect when volume changes
    const onCanPlay = () => setReady(true);
    const onError = () => setReady(true);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setCurrentTime(0);
      if (playlist.length === 1) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      }
    };
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    const t = setTimeout(() => setReady(true), 2000);
    return () => {
      clearTimeout(t);
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init when playlist ready, volume handled by separate effect
  }, [isClient, playlist]);

  // When currentTrackIndex changes (user selected another song), load that track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready || playlist.length === 0) return;
    if (lastLoadedIndexRef.current === currentTrackIndex) return;
    const track = playlist[currentTrackIndex];
    if (!track) return;
    lastLoadedIndexRef.current = currentTrackIndex;
    audio.src = track.src;
    audio.load();
    const id = setTimeout(() => {
      setCurrentTime(0);
      setDuration(0);
    }, 0);
    if (isPlaying) audio.play().catch(() => {});
    return () => clearTimeout(id);
  }, [currentTrackIndex, ready, isPlaying, playlist]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    const audio = audioRef.current;
    if (audio && !isMuted) audio.volume = v;
  }, [isMuted]);

  const selectTrack = useCallback((index: number) => {
    if (index === currentTrackIndex) return;
    setCurrentTrackIndex(index);
  }, [currentTrackIndex]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isClient || playlistLoading || playlist.length === 0 || !ready) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.4 }}
      className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2"
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-rose-200/60 shadow-xl p-4 min-w-[260px] mb-2">
              <p className="text-xs font-sans uppercase tracking-wider text-stone-500 mb-3">Background music</p>

              {/* Song selection - filenames from public/music */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1.5">Track</label>
                <select
                  value={currentTrackIndex}
                  onChange={(e) => selectTrack(Number(e.target.value))}
                  className="w-full rounded-lg border border-stone-200 bg-white/80 px-3 py-2 text-sm text-stone-700 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-300"
                >
                  {playlist.map((track, i) => (
                    <option key={track.src} value={i}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mb-4 cursor-pointer" onClick={(e) => {
                const audio = audioRef.current;
                if (!audio || !duration) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                audio.currentTime = x * duration;
              }}>
                <motion.div
                  className="h-full bg-rose-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shrink-0"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={playNext}
                    className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
                    title="Next song"
                    aria-label="Next song"
                  >
                    <span className="text-lg font-medium leading-none">›</span>
                  </button>
                )}
                <div className="flex-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1.5 accent-rose-500 cursor-pointer"
                    aria-label="Volume"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md border border-rose-200/60 shadow-lg flex items-center justify-center text-stone-600 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-300"
        title={expanded ? 'Close music' : 'Music'}
        aria-label="Music controls"
      >
        <Music className={`w-6 h-6 ${isPlaying ? 'text-rose-500' : ''}`} />
      </button>
    </motion.div>
  );
}

// Animated rings component
function WeddingRings() {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 mb-8"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <motion.div
        className="w-4 h-4 rounded-full border-2 border-rose-300/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="w-5 h-5 rounded-full border-2 border-stone-400/60"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="w-4 h-4 rounded-full border-2 border-rose-300/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

const WEDDING_SECTIONS = [
  {
    id: 1,
    title: "The Beginning",
    subtitle: "How we met",
    description: "It all started with a simple hello. From that moment, we knew our lives would never be the same. Every conversation felt like coming home.",
    color: "bg-[#fdfcf8]",
    textColor: "text-stone-800",
    image: "https://picsum.photos/seed/wedding1/1200/1600",
    icon: <Heart className="w-6 h-6 text-rose-400" />,
  },
  {
    id: 2,
    title: "The Proposal",
    subtitle: "A moment in time",
    description: "Under the starlit sky, with the sound of waves crashing against the shore, he asked the question that would change our forever. She said yes.",
    color: "bg-[#f5f2ed]",
    textColor: "text-stone-800",
    image: "https://picsum.photos/seed/wedding2/1200/1600",
    icon: <Sparkles className="w-6 h-6 text-amber-400" />,
  },
  {
    id: 3,
    title: "The Big Day",
    subtitle: "June 15, 2025",
    description: "Surrounded by our dearest family and friends, we promised to love and cherish each other for all the days of our lives. A day filled with joy and laughter.",
    color: "bg-[#ece8e1]",
    textColor: "text-stone-800",
    image: "https://picsum.photos/seed/wedding3/1200/1600",
    icon: <Calendar className="w-6 h-6 text-stone-500" />,
  },
  {
    id: 4,
    title: "The Celebration",
    subtitle: "Dancing through the night",
    description: "The music played, the wine flowed, and we danced our first dance as husband and wife. A celebration of a love that will last an eternity.",
    color: "bg-[#5a5a40]",
    textColor: "text-stone-100",
    image: "https://picsum.photos/seed/wedding4/1200/1600",
    icon: <Music className="w-6 h-6 text-stone-200" />,
  },
  {
    id: 5,
    type: 'countdown',
    title: "Our First Anniversary",
    subtitle: "Counting down the days",
    description: "We are eagerly waiting to celebrate our first year of marriage. Every day has been a new chapter in our beautiful story.",
    color: "bg-[#4a4a30]",
    textColor: "text-stone-100",
    image: "https://picsum.photos/seed/anniversary/1200/1600",
    icon: <Timer className="w-6 h-6 text-rose-300" />,
  }
];

const STORY_SECTION_ANCHORS: Record<number, string> = {
  0: 'about',
  1: 'services',
  2: 'portfolio',
};

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
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]);

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
              src="https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/sign/gallery/full/hero-image-1772817907417.jfif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjVmMGY5MS0xY2M5LTQwOGEtOTM4MS04YTE2ZjViNDIyNjgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYWxsZXJ5L2Z1bGwvaGVyby1pbWFnZS0xNzcyODE3OTA3NDE3LmpmaWYiLCJpYXQiOjE3NzI4MTc5MjAsImV4cCI6MTc3MjgyMTUyMH0.QD33c9HjVHFSkuCmKbn6kWksl0AxxruJoLQRjroLk_4" 
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
          className="relative z-20 text-center px-6 max-w-4xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/80 font-sans font-medium mb-6"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            Suborna & Hridoy
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-white leading-[1.1] tracking-tight"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
          >
            Turning Your Wedding Dreams
            <span className="block italic font-light mt-2">Into Ultimate Reality</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 text-base sm:text-lg text-white/90 font-sans font-light tracking-wide max-w-xl mx-auto leading-relaxed"
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
          >
            Crafting every detail to shape your perfect wedding day with love and elegance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="#about"
              className="px-10 py-4 bg-white text-stone-900 text-sm tracking-[0.15em] font-sans font-semibold rounded-full hover:bg-stone-100 hover:scale-105 transition-all duration-300 shadow-xl"
            >
              EXPLORE OUR STORY
            </Link>
            <Link
              href="/gallery"
              className="px-10 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-sm tracking-[0.15em] font-sans font-medium rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              VIEW GALLERY
            </Link>
          </motion.div>
        </motion.div>

        <FloralDivider />
      </section>

      {/* Overlapping Album Sections */}
      <div className="relative">
        {WEDDING_SECTIONS.map((section, index) => (
          <section
            key={section.id || section.title}
            id={STORY_SECTION_ANCHORS[index]}
            className={`sticky top-0 scroll-mt-24 h-screen w-full flex items-center justify-center p-4 md:p-12 ${section.color} ${section.textColor} shadow-[0_-20px_50px_rgba(0,0,0,0.05)]`}
            style={{ 
              zIndex: index + 1,
            }}
          >
            <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: false, margin: "-100px" }}
                className="order-2 md:order-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-stone-200/50 flex items-center justify-center">
                    {section.icon}
                  </div>
                  <span className="text-sm uppercase tracking-widest font-sans font-bold opacity-60">
                    {section.subtitle}
                  </span>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif font-light mb-8 leading-tight">
                  {section.title}
                </h2>
                <p className="text-lg md:text-xl font-serif leading-relaxed opacity-80 max-w-md">
                  {section.description}
                </p>
                
                {section.type === 'countdown' ? (
                  <ShiftingCountdown targetDate="2026-06-15T00:00:00" />
                ) : (
                  <div className="mt-12 flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-tighter font-sans opacity-40">Location</span>
                      <span className="text-sm font-sans flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Tuscany, Italy
                      </span>
                    </div>
                    <div className="w-px h-8 bg-stone-300/30" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-tighter font-sans opacity-40">Photographer</span>
                      <span className="text-sm font-sans flex items-center gap-1">
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
                viewport={{ once: false }}
                className="order-1 md:order-2 relative aspect-[3/4] md:aspect-auto md:h-[70vh] rounded-2xl overflow-hidden shadow-2xl border-[12px] border-white"
              >
                <Image 
                  src={section.image || ''} 
                  alt={section.title} 
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

      {/* Final Section */}
      <section id="contact" className="scroll-mt-24 min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] via-[#252525] to-[#1a1a1a] text-white p-8 text-center relative z-50 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="max-w-3xl relative z-10"
        >
          {/* Decorative line above */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-24 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent mx-auto mb-12"
          />
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-6 tracking-tight">
            To be continued
            <span className="text-rose-400">...</span>
          </h2>
          
          <p className="text-stone-400 font-serif italic text-lg sm:text-xl mb-4">
            &quot;And so the adventure begins.&quot;
          </p>
          
          {/* Names */}
          <p className="text-2xl sm:text-3xl font-light italic mb-12" style={{ fontFamily: "'Dancing Script', cursive" }}>
            Suborna & Hridoy
          </p>
          
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="w-16 h-px bg-stone-700" />
            <Heart className="w-5 h-5 text-rose-400/60" />
            <div className="w-16 h-px bg-stone-700" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 border border-stone-600 rounded-full font-sans text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-stone-900 hover:border-white transition-all duration-500"
            >
              Replay Story
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full font-sans text-sm uppercase tracking-[0.2em] hover:from-rose-400 hover:to-rose-500 transition-all duration-500 shadow-lg shadow-rose-500/25"
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
          <p className="text-xs text-stone-600 font-sans tracking-wider">Made with love • 2025 • Developer: Abu Saeed</p>
        </div>
      </section>
    </main>
  );
}
