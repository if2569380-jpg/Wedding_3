'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ArrowLeft, 
  Play, 
  Pause, 
  Grid3X3, 
  LayoutGrid, 
  Maximize2, 
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Copy,
  Check,
  LogOut,
  Search
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseBrowser';
import { useGallerySettings } from '@/app/providers';
import WelcomeBanner from '@/components/WelcomeBanner';

interface GalleryImage {
  id: string;
  src: string;
  full_src: string;
  alt: string;
  category: string;
  created_at: string;
}

const CATEGORIES = ['All', 'Ceremony', 'Reception', 'Portraits', 'Details'];

// 3D Tilt Photo Card Component
interface PhotoCardProps {
  photo: GalleryImage;
  index: number;
  viewMode: 'masonry' | 'grid';
  showWatermark: boolean;
  watermarkText: string;
  favorites: string[];
  settings: {
    allow_favorites: boolean;
  };
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

function PhotoCard({ photo, index, viewMode, showWatermark, watermarkText, favorites, settings, onClick, onToggleFavorite }: PhotoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' });
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={`group relative cursor-pointer overflow-hidden rounded-xl transition-transform duration-200 ease-out ${
        viewMode === 'masonry' ? 'break-inside-avoid' : 'aspect-square'
      }`}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={800}
        height={600}
        className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
          viewMode === 'grid' ? 'h-full' : 'h-auto'
        }`}
        referrerPolicy="no-referrer"
        unoptimized
      />

      {showWatermark && (
        <div className="absolute inset-0 pointer-events-none flex items-end justify-end p-3">
          <span className="rounded-md bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white/85 font-sans">
            {watermarkText}
          </span>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-serif text-lg">{photo.alt}</p>
          <p className="text-white/70 text-xs uppercase tracking-widest font-sans mt-1">
            {photo.category}
          </p>
        </div>
        
        {/* Favorite Button */}
        {settings.allow_favorites && (
          <button
            onClick={onToggleFavorite}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                favorites.includes(photo.id)
                  ? 'text-rose-400 fill-rose-400'
                  : 'text-white'
              }`}
            />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Skeleton Loading Component
function PhotoSkeleton({ viewMode }: { viewMode: 'masonry' | 'grid' }) {
  return (
    <div className={`animate-pulse bg-stone-200 rounded-xl overflow-hidden ${
      viewMode === 'grid' ? 'aspect-square' : 'h-64'
    }`}>
      <div className="w-full h-full bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 animate-shimmer" />
    </div>
  );
}

export default function GalleryPage() {
  const { settings } = useGallerySettings();
  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>(settings.default_view_mode);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const router = useRouter();

  // Family member welcome state
  const [familyMember, setFamilyMember] = useState<{
    id: string;
    name: string;
    relationship: string | null;
    welcome_message: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Fetch current user and family member data
  useEffect(() => {
    async function fetchFamilyMember() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          const response = await fetch(`/api/family-members?email=${encodeURIComponent(user.email)}`);
          const data = await response.json();
          
          if (data.members && data.members.length > 0) {
            setFamilyMember(data.members[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching family member:', error);
      }
    }

    fetchFamilyMember();
  }, []);

  // Fetch photos from Supabase
  useEffect(() => {
    async function fetchPhotos() {
      try {
        setLoading(true);
        const response = await fetch('/api/gallery');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch photos');
        }
        
        setPhotos(data.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gallery-favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('gallery-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const filteredPhotos = photos.filter((photo) => {
    const matchesCategory = selectedCategory === 'All' || photo.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      photo.alt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const parsedItemsPerPage = Number(settings.items_per_page);
  const itemsPerPage = Number.isFinite(parsedItemsPerPage) && parsedItemsPerPage > 0
    ? Math.floor(parsedItemsPerPage)
    : 20;
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPhotos.length;
  const displayedCount = Math.min(visibleCount, filteredPhotos.length);
  const watermarkText = String(settings.watermark_text || settings.gallery_title).trim();
  const showWatermark = settings.watermark_enabled && watermarkText.length > 0;

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [itemsPerPage, selectedCategory, photos.length]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || !canLoadMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore && !loadingMore) {
          setLoadingMore(true);
          // Simulate slight delay for smooth loading
          setTimeout(() => {
            setVisibleCount((prev) => prev + itemsPerPage);
            setLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, loadingMore, itemsPerPage]);

  useEffect(() => {
    if (selectedPhoto === null) return;
    if (selectedPhoto >= filteredPhotos.length) {
      setSelectedPhoto(null);
      setIsSlideshow(false);
      document.body.style.overflow = 'unset';
    }
  }, [filteredPhotos.length, selectedPhoto]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Slideshow functionality
  useEffect(() => {
    if (isSlideshow && selectedPhoto !== null) {
      slideshowRef.current = setInterval(() => {
        setSelectedPhoto((prev) => {
          if (prev === null) return 0;
          return prev === filteredPhotos.length - 1 ? 0 : prev + 1;
        });
      }, settings.slideshow_interval * 1000);
    } else {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
    }

    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, [isSlideshow, selectedPhoto, filteredPhotos.length, settings.slideshow_interval]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const toggleSlideshow = useCallback(() => {
    setIsSlideshow((prev) => !prev);
  }, []);

  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  }, []);

  const openLightbox = useCallback((index: number) => {
    setSelectedPhoto(index);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedPhoto(null);
    setIsSlideshow(false);
    setShareMenuOpen(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    document.body.style.overflow = 'unset';
  }, []);

  const goToPrevious = useCallback(() => {
    if (selectedPhoto !== null) {
      setSelectedPhoto(selectedPhoto === 0 ? filteredPhotos.length - 1 : selectedPhoto - 1);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [selectedPhoto, filteredPhotos.length]);

  const goToNext = useCallback(() => {
    if (selectedPhoto !== null) {
      setSelectedPhoto(selectedPhoto === filteredPhotos.length - 1 ? 0 : selectedPhoto + 1);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [selectedPhoto, filteredPhotos.length]);

  // Zoom functionality
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Download photo
  const handleDownload = useCallback(async () => {
    if (selectedPhoto === null) return;
    const photo = filteredPhotos[selectedPhoto];
    try {
      const res = await fetch(photo.full_src, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wedding-${photo.alt.replace(/\s+/g, '-').toLowerCase()}-${photo.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab for user to save
      window.open(photo.full_src, '_blank');
    }
  }, [selectedPhoto, filteredPhotos]);

  // Share: copy link
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?photo=${selectedPhoto ?? 0}`
    : '';
  const shareText = selectedPhoto !== null
    ? `Wedding photo: ${filteredPhotos[selectedPhoto]?.alt ?? 'Our wedding'}`
    : 'Our wedding gallery';

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  }, [shareUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  }, [shareUrl, shareText]);

  const handleShareFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  }, [shareUrl]);

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gesture handlers for mobile swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchStartX.current - touchX;
    const diffY = touchStartY.current - touchY;

    // Prevent default only for horizontal swipes to allow vertical scroll when not zoomed
    if (zoomLevel > 1) {
      e.preventDefault();
    } else if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, [zoomLevel]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Double tap detection for zoom
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime.current;
    if (tapLength < 300 && tapLength > 0) {
      // Double tap - toggle zoom
      if (zoomLevel > 1) {
        handleResetZoom();
      } else {
        setZoomLevel(2);
      }
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = currentTime;
    }

    // Swipe detection (only when not zoomed)
    if (zoomLevel === 1 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        goToNext(); // Swipe left - next image
      } else if (diffX < -50) {
        goToPrevious(); // Swipe right - previous image
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [zoomLevel, goToNext, goToPrevious, handleResetZoom]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhoto === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (settings.allow_slideshow && (e.key === ' ' || e.key === 'Enter')) toggleSlideshow();
      if (settings.allow_zoom && (e.key === '+' || e.key === '=')) handleZoomIn();
      if (settings.allow_zoom && e.key === '-') handleZoomOut();
      if (settings.allow_zoom && e.key === '0') handleResetZoom();
      if (settings.allow_fullscreen && e.key === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, closeLightbox, goToPrevious, goToNext, toggleSlideshow, handleZoomIn, handleZoomOut, handleResetZoom, toggleFullscreen, settings.allow_slideshow, settings.allow_zoom, settings.allow_fullscreen]);

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfcf8]/90 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-sans text-sm uppercase tracking-widest">Back</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-serif font-light text-stone-800">
              {settings.gallery_title}
            </h1>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'masonry' ? 'grid' : 'masonry')}
                className="p-2 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors"
                title={viewMode === 'masonry' ? 'Switch to Grid View' : 'Switch to Masonry View'}
              >
                {viewMode === 'masonry' ? <Grid3X3 className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
              </button>
              {/* Fullscreen Toggle */}
              {settings.allow_fullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              )}
              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors disabled:opacity-50"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner for Family Members */}
      {showWelcome && familyMember && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <WelcomeBanner
            member={familyMember}
            onDismiss={() => setShowWelcome(false)}
          />
        </div>
      )}

      {/* Category Filter */}
      {settings.show_category_filter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-sans text-sm uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {settings.show_photo_count && (
            <p className="text-center text-stone-500 font-sans text-sm mt-4">
              {displayedCount} of {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Photo Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className={
            viewMode === 'masonry'
              ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          }>
            {Array.from({ length: 12 }).map((_, i) => (
              <PhotoSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-rose-600 font-sans">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-600 font-sans">No photos available yet.</p>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className={
                viewMode === 'masonry'
                  ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              }
            >
              <AnimatePresence mode="popLayout">
                {visiblePhotos.map((photo, index) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    viewMode={viewMode}
                    showWatermark={showWatermark}
                    watermarkText={watermarkText}
                    favorites={favorites}
                    settings={{ allow_favorites: settings.allow_favorites }}
                    onClick={() => openLightbox(index)}
                    onToggleFavorite={(e) => toggleFavorite(photo.id, e)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
            
            {/* Infinite scroll trigger and loading indicator */}
            <div ref={loadMoreRef} className="mt-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-3 text-stone-500">
                  <div className="w-6 h-6 border-3 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  <span className="text-sm font-sans">Loading more...</span>
                </div>
              )}
              {canLoadMore && !loadingMore && (
                <div className="h-8" /> /* Spacer for intersection observer */
              )}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-white font-sans text-sm">
                  {selectedPhoto + 1} / {filteredPhotos.length}
                </span>
                {isSlideshow && (
                  <span className="text-rose-400 text-xs uppercase tracking-widest font-sans animate-pulse">
                    Slideshow
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                {settings.allow_zoom && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                      title="Zoom Out (-)"
                    >
                      <ZoomOut className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white text-sm font-sans min-w-[50px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                      title="Reset Zoom (0)"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>
                    <div className="w-px h-8 bg-white/20 mx-2" />
                  </>
                )}
                {/* Download */}
                {settings.allow_downloads && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                )}
                {/* Share dropdown */}
                {settings.allow_share && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShareMenuOpen((o) => !o); }}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                    {shareMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => { e.stopPropagation(); setShareMenuOpen(false); }}
                          aria-hidden
                        />
                        <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-xl bg-stone-800/95 backdrop-blur-md border border-white/10 shadow-xl py-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-sm text-white"
                          >
                            {linkCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {linkCopied ? 'Copied!' : 'Copy link'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(); }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-sm text-white"
                          >
                            <span className="text-lg">WhatsApp</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareFacebook(); }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-sm text-white"
                          >
                            <span className="text-lg">Facebook</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {(settings.allow_downloads || settings.allow_share) && (
                  <div className="w-px h-8 bg-white/20 mx-2" />
                )}
                {/* Slideshow Toggle */}
                {settings.allow_slideshow && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSlideshow(); }}
                    className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                      isSlideshow ? 'bg-rose-500' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title="Toggle Slideshow (Space)"
                  >
                    {isSlideshow ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  </button>
                )}
                {/* Fullscreen */}
                {settings.allow_fullscreen && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Toggle Fullscreen (F)"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
                  </button>
                )}
                {/* Close */}
                <button
                  onClick={closeLightbox}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Image Container with Zoom & Pan + Touch Gestures */}
            <motion.div
              key={selectedPhoto}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-[90vw] max-h-[85vh] overflow-hidden touch-none"
              onClick={(e) => e.stopPropagation()}
              ref={imageContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={`relative cursor-move ${isSlideshow ? 'animate-ken-burns' : ''}`}
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <Image
                  src={filteredPhotos[selectedPhoto].full_src}
                  alt={filteredPhotos[selectedPhoto].alt}
                  width={1200}
                  height={1600}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg select-none"
                  referrerPolicy="no-referrer"
                  priority
                  draggable={false}
                  unoptimized
                />
                {showWatermark && (
                  <div className="absolute inset-0 pointer-events-none flex items-end justify-end p-4 md:p-6">
                    <span className="rounded-lg bg-black/45 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-white/90 font-sans">
                      {watermarkText}
                    </span>
                  </div>
                )}
              </div>

              {/* Favorite in Lightbox */}
              {settings.allow_favorites && (
                <button
                  onClick={() => toggleFavorite(filteredPhotos[selectedPhoto].id)}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      favorites.includes(filteredPhotos[selectedPhoto].id)
                        ? 'text-rose-400 fill-rose-400'
                        : 'text-white'
                    }`}
                  />
                </button>
              )}
            </motion.div>

            {/* Image Info - Outside image container, above thumbnails */}
            <div className="absolute bottom-24 left-4 right-4 md:left-8 md:right-auto md:max-w-md">
              <div className="bg-black/60 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
                <h3 className="text-white font-serif text-lg md:text-xl">
                  {filteredPhotos[selectedPhoto].alt}
                </h3>
                <p className="text-white/60 text-xs uppercase tracking-widest font-sans mt-1">
                  {filteredPhotos[selectedPhoto].category}
                </p>
              </div>
            </div>

            {/* Thumbnail Strip - Better positioned */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[85vw] overflow-x-auto px-4 py-2 scrollbar-hide bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
              {filteredPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(index);
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden transition-all border-2 ${
                    selectedPhoto === index
                      ? 'border-white ring-2 ring-white/30'
                      : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                </button>
              ))}
            </div>
            {/* Tips Button - Shows keyboard shortcuts on hover/click */}
            {settings.enable_keyboard_shortcuts && (
              <div className="absolute top-20 right-4 z-50">
                <div className="group relative">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Keyboard shortcuts"
                  >
                    <span className="text-white text-sm font-bold">?</span>
                  </button>
                  {/* Tooltip */}
                  <div className="absolute right-0 top-12 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-stone-800/95 backdrop-blur-md rounded-xl border border-white/10 shadow-xl py-3 px-4">
                      <h4 className="text-white/80 text-xs uppercase tracking-widest font-sans mb-3 border-b border-white/10 pb-2">
                        Keyboard Shortcuts
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-white">
                          <span className="text-white/60">← →</span>
                          <span>Navigate</span>
                        </div>
                        <div className="flex justify-between text-white">
                          <span className="text-white/60">+ / -</span>
                          <span>Zoom in/out</span>
                        </div>
                        <div className="flex justify-between text-white">
                          <span className="text-white/60">0</span>
                          <span>Reset zoom</span>
                        </div>
                        <div className="flex justify-between text-white">
                          <span className="text-white/60">Space</span>
                          <span>Slideshow</span>
                        </div>
                        <div className="flex justify-between text-white">
                          <span className="text-white/60">F</span>
                          <span>Fullscreen</span>
                        </div>
                        <div className="flex justify-between text-white">
                          <span className="text-white/60">ESC</span>
                          <span>Close</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
