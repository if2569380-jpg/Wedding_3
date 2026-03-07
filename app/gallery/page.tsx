'use client';

import { motion, AnimatePresence } from 'motion/react';
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
  Check,
  Link2,
  Send,
  Mail,
  LogOut,
  Search
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseBrowser';
import { useGallerySettings } from '@/app/providers';
import WelcomeBanner from '@/components/WelcomeBanner';
import { useIsMobile } from '@/hooks/use-mobile';

interface GalleryImageThumb {
  id: string;
  src: string;
  alt: string;
  category: string;
  created_at: string;
}

interface GalleryImageFull {
  id: string;
  full_src: string;
  expires_at: string;
}

interface GalleryApiResponse {
  images: GalleryImageThumb[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

const CATEGORIES = ['All', 'Ceremony', 'Reception', 'Portraits', 'Details'];

// 3D Tilt Photo Card Component
interface PhotoCardProps {
  photo: GalleryImageThumb;
  index: number;
  viewMode: 'masonry' | 'grid';
  isMobile: boolean;
  showWatermark: boolean;
  watermarkText: string;
  favorites: string[];
  settings: {
    allow_favorites: boolean;
  };
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

function PhotoCard({ photo, index, viewMode, isMobile, showWatermark, watermarkText, favorites, settings, onClick, onToggleFavorite }: PhotoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
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
    if (isMobile) return;
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
      style={isMobile ? undefined : tiltStyle}
      className={`group relative cursor-pointer overflow-hidden rounded-xl transition-transform duration-200 ease-out ${
        viewMode === 'masonry' ? 'break-inside-avoid' : 'aspect-square'
      }`}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={800}
        height={600}
        className={`w-full object-cover transition-transform duration-500 ${isMobile ? '' : 'group-hover:scale-110'} ${
          viewMode === 'grid' ? 'h-full' : 'h-auto'
        }`}
        referrerPolicy="no-referrer"
        sizes={viewMode === 'grid' ? '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw' : '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'}
      />

      {showWatermark && (
        <div className="absolute inset-0 pointer-events-none flex items-end justify-end p-3">
          <span className="rounded-md bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white/85 font-sans">
            {watermarkText}
          </span>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
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
  const isMobile = useIsMobile();
  const [photos, setPhotos] = useState<GalleryImageThumb[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [fullImageCache, setFullImageCache] = useState<Record<string, GalleryImageFull>>({});
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const deepLinkHandledRef = useRef(false);
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

  // Generate search suggestions based on photo names and categories
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const photoNames = photos
      .filter(p => p.alt.toLowerCase().includes(query))
      .map(p => p.alt)
      .slice(0, 5);
    const categories = CATEGORIES.filter(c => 
      c !== 'All' && c.toLowerCase().includes(query)
    );
    return [...new Set([...categories, ...photoNames])].slice(0, 8);
  }, [searchQuery, photos]);

  const parsedItemsPerPage = Number(settings.items_per_page);
  const itemsPerPage = Number.isFinite(parsedItemsPerPage) && parsedItemsPerPage > 0
    ? Math.floor(parsedItemsPerPage)
    : 20;
  const filteredPhotos = photos;
  const displayedCount = filteredPhotos.length;
  const totalCount = totalPhotos > 0 ? totalPhotos : filteredPhotos.length;
  const canLoadMore = hasMore && nextCursor !== null;
  const watermarkText = String(settings.watermark_text || settings.gallery_title).trim();
  const showWatermark = settings.watermark_enabled && watermarkText.length > 0;
  const selectedPhotoData = selectedPhoto !== null ? filteredPhotos[selectedPhoto] ?? null : null;

  const loadPhotos = useCallback(async (cursor: string | null, mode: 'replace' | 'append') => {
    try {
      if (mode === 'replace') {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      params.set('limit', String(itemsPerPage));
      if (cursor) params.set('cursor', cursor);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) params.set('q', trimmedQuery);

      const response = await fetch(`/api/gallery?${params.toString()}`);
      const data: GalleryApiResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch photos');
      }

      if (mode === 'replace') {
        setPhotos(data.images || []);
      } else {
        setPhotos((prev) => [...prev, ...(data.images || [])]);
      }

      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
      setTotalPhotos(Number.isFinite(data.total) ? data.total : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      if (mode === 'replace') {
        setLoading(false);
      }
    }
  }, [itemsPerPage, searchQuery, selectedCategory]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadPhotos(null, 'replace');
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [loadPhotos]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || !canLoadMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore && !loadingMore && nextCursor) {
          setLoadingMore(true);
          void loadPhotos(nextCursor, 'append').finally(() => {
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, loadPhotos, loadingMore, nextCursor]);

  useEffect(() => {
    if (selectedPhoto === null) return;
    if (selectedPhoto >= filteredPhotos.length) {
      setSelectedPhoto(null);
      setIsSlideshow(false);
      document.body.style.overflow = 'unset';
    }
  }, [filteredPhotos.length, selectedPhoto]);

  const getCachedFullImageUrl = useCallback((photo: GalleryImageThumb): string | null => {
    const cached = fullImageCache[photo.id];
    if (!cached) return null;

    const expiry = new Date(cached.expires_at).getTime();
    if (Number.isFinite(expiry) && expiry > Date.now() + 60_000) {
      return cached.full_src;
    }

    return null;
  }, [fullImageCache]);

  const ensureFullImageUrl = useCallback(async (photo: GalleryImageThumb): Promise<string> => {
    const cachedUrl = getCachedFullImageUrl(photo);
    if (cachedUrl) return cachedUrl;

    try {
      const response = await fetch(`/api/gallery/full-url?id=${photo.id}`);
      const data: GalleryImageFull & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load full image');
      }

      const fullImage: GalleryImageFull = {
        id: data.id,
        full_src: data.full_src,
        expires_at: data.expires_at,
      };

      setFullImageCache((prev) => ({ ...prev, [photo.id]: fullImage }));
      return fullImage.full_src;
    } catch {
      return photo.src;
    }
  }, [getCachedFullImageUrl]);

  useEffect(() => {
    if (selectedPhoto === null) return;
    const photo = filteredPhotos[selectedPhoto];
    if (!photo) return;

    void ensureFullImageUrl(photo);
  }, [ensureFullImageUrl, filteredPhotos, selectedPhoto]);

  // Keep URL in sync with currently selected image for easy sharing.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (selectedPhotoData) {
      url.searchParams.set('photoId', selectedPhotoData.id);
    } else {
      url.searchParams.delete('photoId');
    }

    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [selectedPhotoData]);

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

    const photo = filteredPhotos[index];
    if (photo) {
      void ensureFullImageUrl(photo);
    }
  }, [ensureFullImageUrl, filteredPhotos]);

  // Open a specific image when gallery URL contains a shared photo id.
  useEffect(() => {
    if (deepLinkHandledRef.current || filteredPhotos.length === 0) return;
    if (typeof window === 'undefined') return;

    const params = new URL(window.location.href).searchParams;
    const photoIdFromUrl = params.get('photoId');
    const legacyPhotoIndex = Number.parseInt(params.get('photo') ?? '', 10);

    if (!photoIdFromUrl && !Number.isFinite(legacyPhotoIndex)) {
      deepLinkHandledRef.current = true;
      return;
    }

    const index = photoIdFromUrl
      ? filteredPhotos.findIndex((photo) => photo.id === photoIdFromUrl)
      : legacyPhotoIndex;

    if (index >= 0 && index < filteredPhotos.length) {
      openLightbox(index);
      deepLinkHandledRef.current = true;
    }
  }, [filteredPhotos, openLightbox]);

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
      const nextIndex = selectedPhoto === 0 ? filteredPhotos.length - 1 : selectedPhoto - 1;
      setSelectedPhoto(nextIndex);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      const photo = filteredPhotos[nextIndex];
      if (photo) {
        void ensureFullImageUrl(photo);
      }
    }
  }, [ensureFullImageUrl, filteredPhotos, selectedPhoto]);

  const goToNext = useCallback(() => {
    if (selectedPhoto !== null) {
      const nextIndex = selectedPhoto === filteredPhotos.length - 1 ? 0 : selectedPhoto + 1;
      setSelectedPhoto(nextIndex);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      const photo = filteredPhotos[nextIndex];
      if (photo) {
        void ensureFullImageUrl(photo);
      }
    }
  }, [ensureFullImageUrl, filteredPhotos, selectedPhoto]);

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
    if (!photo) return;
    const fullImageUrl = await ensureFullImageUrl(photo);

    try {
      const res = await fetch(fullImageUrl, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wedding-${photo.alt.replace(/\s+/g, '-').toLowerCase()}-${photo.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab for user to save
      window.open(fullImageUrl, '_blank');
    }
  }, [ensureFullImageUrl, selectedPhoto, filteredPhotos]);

  // Share
  const shareUrl = typeof window !== 'undefined'
    ? (() => {
        const url = new URL(window.location.href);
        if (selectedPhotoData) {
          url.searchParams.set('photoId', selectedPhotoData.id);
        }
        return `${url.origin}${url.pathname}${url.search}`;
      })()
    : '';
  const shareText = selectedPhotoData
    ? `Wedding photo: ${selectedPhotoData.alt}`
    : 'Our wedding gallery';
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setShareMenuOpen(false);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!selectedPhotoData) return;

    if (!canNativeShare) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: selectedPhotoData.alt,
        text: shareText,
        url: shareUrl,
      });
      setShareMenuOpen(false);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await handleCopyLink();
      }
    }
  }, [canNativeShare, handleCopyLink, selectedPhotoData, shareText, shareUrl]);

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

  const openShareTarget = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  }, []);

  const handleShareTelegram = useCallback(() => {
    openShareTarget(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
  }, [openShareTarget, shareText, shareUrl]);

  const handleShareX = useCallback(() => {
    openShareTarget(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
  }, [openShareTarget, shareText, shareUrl]);

  const handleShareEmail = useCallback(() => {
    window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    setShareMenuOpen(false);
  }, [shareText, shareUrl]);

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
        <div className="safe-container px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Mobile Header */}
          <div className="sm:hidden space-y-3">
            <h1 className="w-full text-center text-xl font-serif font-light text-stone-800 px-1 leading-tight">
              {settings.gallery_title}
            </h1>
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors min-h-11"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-sans text-xs uppercase tracking-[0.2em]">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'masonry' ? 'grid' : 'masonry')}
                  className="w-11 h-11 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors flex items-center justify-center"
                  title={viewMode === 'masonry' ? 'Switch to Grid View' : 'Switch to Masonry View'}
                >
                  {viewMode === 'masonry' ? <Grid3X3 className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                </button>
                {settings.allow_fullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="w-11 h-11 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors flex items-center justify-center"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Header */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors min-h-11"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-widest">Back</span>
            </Link>
            <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-serif font-light text-stone-800 px-1 truncate">
              {settings.gallery_title}
            </h1>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setViewMode(viewMode === 'masonry' ? 'grid' : 'masonry')}
                className="w-11 h-11 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors flex items-center justify-center"
                title={viewMode === 'masonry' ? 'Switch to Grid View' : 'Switch to Masonry View'}
              >
                {viewMode === 'masonry' ? <Grid3X3 className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
              </button>
              {settings.allow_fullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="w-11 h-11 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors flex items-center justify-center"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors disabled:opacity-50 flex items-center justify-center"
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
        <div className="safe-container px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
          <WelcomeBanner
            member={familyMember}
            onDismiss={() => setShowWelcome(false)}
          />
        </div>
      )}

      {/* Category Filter & Search */}
      {settings.show_category_filter && (
        <div className="safe-container px-4 sm:px-6 lg:px-8 py-5 sm:py-6 md:py-8">
          {/* Responsive Layout: Mobile stack, Tablet/Desktop row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* Categories - Horizontal scroll on mobile, flex wrap on larger screens */}
            <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center lg:justify-start gap-2 sm:gap-3 overflow-x-auto pb-1 px-0.5 scrollbar-hide lg:overflow-visible lg:pb-0 lg:flex-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`control-pill whitespace-nowrap font-sans text-xs sm:text-sm md:text-base uppercase tracking-[0.08em] sm:tracking-wider transition-all duration-300 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full ${
                    selectedCategory === category
                      ? 'bg-stone-800 text-white shadow-md'
                      : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Right side: Search + Photo Count */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-6">
              {/* Search Input with Suggestions */}
              <div className="relative w-full sm:w-56 md:w-64 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-stone-400 z-10" />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-full border border-stone-200 bg-white text-sm md:text-base focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all shadow-sm"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-50 w-full min-w-0 max-h-56 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm md:text-base text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                      >
                        <Search className="w-3 h-3 md:w-4 md:h-4 text-stone-400" />
                        <span className="truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Photo Count */}
              {settings.show_photo_count && (
                <span className="text-stone-500 font-sans text-xs sm:text-sm md:text-base text-center sm:text-right whitespace-nowrap">
                  {displayedCount} of {totalCount} photo{totalCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="safe-container px-3 sm:px-6 lg:px-8 xl:px-10 pb-14 sm:pb-16 md:pb-20">
        {loading ? (
            <div className={
              viewMode === 'masonry'
                ? 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 md:gap-5 space-y-3 sm:space-y-4 md:space-y-5'
                : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5'
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
                  ? 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 md:gap-5 space-y-3 sm:space-y-4 md:space-y-5'
                  : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5'
              }
            >
              <AnimatePresence mode="popLayout">
                {filteredPhotos.map((photo, index) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    viewMode={viewMode}
                    isMobile={isMobile}
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
            <div className="absolute top-0 left-0 right-0 p-2 sm:p-3 md:p-4 flex flex-col gap-2 sm:gap-3 z-50 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-sans text-xs sm:text-sm md:text-base">
                  {selectedPhoto + 1} / {filteredPhotos.length}
                </span>
                {isSlideshow && (
                  <span className="text-rose-400 text-[10px] sm:text-xs uppercase tracking-widest font-sans animate-pulse">
                    Slideshow
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-1">
                {/* Zoom Controls */}
                {settings.allow_zoom && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                      title="Zoom Out (-)"
                    >
                      <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                    <span className="text-white text-xs sm:text-sm font-sans min-w-[40px] sm:min-w-[50px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                      title="Reset Zoom (0)"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                    <div className="w-px h-6 sm:h-8 bg-white/20 mx-1 sm:mx-2" />
                  </>
                )}
                {/* Download */}
                {settings.allow_downloads && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                    title="Download"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                )}
                {/* Share dropdown */}
                {settings.allow_share && (
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShareMenuOpen((o) => !o); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                    {shareMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => { e.stopPropagation(); setShareMenuOpen(false); }}
                          aria-hidden
                        />
                        <div className="absolute right-0 top-12 z-50 w-[260px] max-w-[calc(100vw-2rem)] rounded-2xl bg-stone-800/95 backdrop-blur-md border border-white/10 shadow-xl p-3">
                          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-widest text-white/50 font-sans">Share photo</p>
                            <p className="mt-1 text-sm text-white truncate">{selectedPhotoData?.alt ?? 'Wedding photo'}</p>
                          </div>
                          {canNativeShare && (
                            <button
                              onClick={(e) => { e.stopPropagation(); void handleNativeShare(); }}
                              className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-sm text-white"
                            >
                              <Share2 className="w-4 h-4" />
                              Share now
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                            className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-sm text-white"
                          >
                            {linkCopied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
                            {linkCopied ? 'Copied!' : 'Copy link'}
                          </button>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(); }}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white text-left"
                            >
                              WhatsApp
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareFacebook(); }}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white text-left"
                            >
                              Facebook
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareTelegram(); }}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white text-left flex items-center gap-2"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Telegram
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareX(); }}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white text-left"
                            >
                              X (Twitter)
                            </button>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareEmail(); }}
                            className="mt-2 w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white text-left flex items-center gap-2"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {(settings.allow_downloads || settings.allow_share) && (
                  <div className="w-px h-6 sm:h-8 bg-white/20 mx-1 sm:mx-2" />
                )}
                {/* Slideshow Toggle */}
                {settings.allow_slideshow && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSlideshow(); }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors shrink-0 ${
                      isSlideshow ? 'bg-rose-500' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title="Toggle Slideshow (Space)"
                  >
                    {isSlideshow ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </button>
                )}
                {/* Fullscreen */}
                {settings.allow_fullscreen && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                    title="Toggle Fullscreen (F)"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </button>
                )}
                {/* Close */}
                <button
                  onClick={closeLightbox}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-1 sm:left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-1 sm:right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors shadow-lg"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>

            {/* Image Container with Zoom & Pan + Touch Gestures */}
            <motion.div
              key={selectedPhoto}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-[96vw] sm:max-w-[92vw] md:max-w-[88vw] lg:max-w-[85vw] h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[82vh] flex items-center justify-center overflow-hidden touch-none px-2 sm:px-4"
              onClick={(e) => e.stopPropagation()}
              ref={imageContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={`relative w-full h-full flex items-center justify-center ${isMobile ? '' : 'cursor-move'} ${isSlideshow ? 'animate-ken-burns' : ''}`}
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? 'none' : 'transform 0.25s ease-out',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <Image
                  src={getCachedFullImageUrl(filteredPhotos[selectedPhoto]) ?? filteredPhotos[selectedPhoto].src}
                  alt={filteredPhotos[selectedPhoto].alt}
                  width={1200}
                  height={1600}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg sm:rounded-xl select-none"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  sizes="(max-width: 640px) 96vw, (max-width: 768px) 92vw, (max-width: 1024px) 88vw, 85vw"
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
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors shadow-lg"
                >
                  <Heart
                    className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-colors ${
                      favorites.includes(filteredPhotos[selectedPhoto].id)
                        ? 'text-rose-400 fill-rose-400'
                        : 'text-white'
                    }`}
                  />
                </button>
              )}
            </motion.div>

            {/* Image Info - Better responsive positioning */}
            <div className="absolute bottom-16 sm:bottom-20 md:bottom-24 left-2 right-2 sm:left-4 sm:right-4 md:left-6 md:right-auto md:max-w-sm lg:max-w-md">
              <div className="bg-black/60 backdrop-blur-md rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 border border-white/10">
                <h3 className="text-white font-serif text-sm sm:text-base md:text-lg lg:text-xl truncate">
                  {filteredPhotos[selectedPhoto].alt}
                </h3>
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-widest font-sans mt-0.5 sm:mt-1">
                  {filteredPhotos[selectedPhoto].category}
                </p>
              </div>
            </div>

            {/* Thumbnail Strip - Responsive sizing */}
            <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 md:gap-3 max-w-[96vw] sm:max-w-[90vw] md:max-w-[85vw] overflow-x-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 scrollbar-hide bg-black/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10">
              {filteredPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(index);
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                    void ensureFullImageUrl(photo);
                  }}
                  className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl overflow-hidden transition-all border-2 ${
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
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
            {/* Tips Button - Shows keyboard shortcuts on hover/click */}
            {settings.enable_keyboard_shortcuts && !isMobile && (
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
