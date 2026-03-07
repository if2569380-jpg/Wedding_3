'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, VolumeX, Play, Pause, ChevronDown } from 'lucide-react';
import { useState, useEffect, useSyncExternalStore, useRef, useCallback } from 'react';
import YouTube from 'react-youtube';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

type PlaylistItem = { 
  name: string; 
  src: string; 
  source_type: 'local' | 'youtube';
};

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([^&\s?]+)$/ // Just the video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function BackgroundMusic() {
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
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);

  const hasMultiple = playlist.length > 1;
  const currentTrack = playlist[currentTrackIndex];
  const isYouTube = currentTrack?.source_type === 'youtube';
  const youtubeVideoId = isYouTube ? extractYouTubeId(currentTrack?.src || '') : null;

  // Fetch playlist from API
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isClient) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTrackDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isClient]);

  const playNext = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const lastLoadedIndexRef = useRef(-1);

  // Initialize audio for local files
  useEffect(() => {
    if (!isClient || playlist.length === 0) return;
    
    // Skip if current track is YouTube
    if (playlist[0]?.source_type === 'youtube') {
      setReady(true);
      return;
    }

    const audio = new Audio(playlist[0].src);
    audio.preload = 'metadata';
    audioRef.current = audio;
    lastLoadedIndexRef.current = 0;
    audio.volume = volume;
    
    const onError = () => setReady(true);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setReady(true);
    };
    const onEnded = () => {
      setCurrentTime(0);
      if (playlist.length === 1) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      }
    };
    
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    
    const t = setTimeout(() => setReady(true), 1200);
    
    return () => {
      clearTimeout(t);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init when playlist ready, volume handled by separate effect
  }, [isClient, playlist]);

  // Handle track change for local audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready || playlist.length === 0) return;
    if (lastLoadedIndexRef.current === currentTrackIndex) return;
    
    const track = playlist[currentTrackIndex];
    if (!track || track.source_type === 'youtube') return;
    
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

  // YouTube player handlers
  const onYouTubeReady = useCallback((event: any) => {
    youtubePlayerRef.current = event.target;
    setDuration(event.target.getDuration() || 0);
    setReady(true);
    if (isPlaying) {
      event.target.playVideo();
    }
  }, [isPlaying]);

  const onYouTubeStateChange = useCallback((event: any) => {
    // States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (event.data === 0) {
      // Video ended - play next
      setCurrentTime(0);
      playNext();
    } else if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
  }, [playNext]);

  // Update YouTube playback based on isPlaying state
  useEffect(() => {
    if (!youtubePlayerRef.current || !isYouTube) return;
    
    if (isPlaying) {
      youtubePlayerRef.current.playVideo();
    } else {
      youtubePlayerRef.current.pauseVideo();
    }
  }, [isPlaying, isYouTube]);

  const togglePlay = useCallback(() => {
    if (isYouTube) {
      setIsPlaying(!isPlaying);
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isYouTube]);

  const toggleMute = useCallback(() => {
    if (isYouTube && youtubePlayerRef.current) {
      if (isMuted) {
        youtubePlayerRef.current.unMute();
        youtubePlayerRef.current.setVolume(volume * 100);
      } else {
        youtubePlayerRef.current.mute();
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (isMuted) {
        audio.volume = volume;
      } else {
        audio.volume = 0;
      }
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume, isYouTube]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    
    if (isYouTube && youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(v * 100);
      if (v === 0) {
        youtubePlayerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        youtubePlayerRef.current.unMute();
        setIsMuted(false);
      }
    } else {
      const audio = audioRef.current;
      if (audio && !isMuted) audio.volume = v;
    }
  }, [isMuted, isYouTube]);

  const selectTrack = useCallback((index: number) => {
    if (index === currentTrackIndex) return;
    setCurrentTrackIndex(index);
    setShowTrackDropdown(false);
    // Reset states for new track
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrackIndex]);

  // Update current time for YouTube
  useEffect(() => {
    if (!isYouTube || !youtubePlayerRef.current) return;
    
    const interval = setInterval(() => {
      if (youtubePlayerRef.current && isPlaying) {
        setCurrentTime(youtubePlayerRef.current.getCurrentTime() || 0);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isYouTube, isPlaying]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isClient || playlistLoading || playlist.length === 0 || !ready) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.4 }}
      className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2"
    >
      {/* Hidden YouTube Player */}
      {isYouTube && youtubeVideoId && (
        <div className="absolute opacity-0 pointer-events-none">
          <YouTube
            videoId={youtubeVideoId}
            opts={{
              height: '1',
              width: '1',
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                loop: 0,
                modestbranding: 1,
              },
            }}
            onReady={onYouTubeReady}
            onStateChange={onYouTubeStateChange}
          />
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-rose-200/60 shadow-xl p-4 min-w-[280px] mb-2 overflow-visible">
              <p className="text-xs font-sans uppercase tracking-wider text-stone-500 mb-3">Background music</p>

              {/* Custom Track Dropdown */}
              <div className="mb-3 relative" ref={dropdownRef}>
                <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1.5">Track</label>
                <button
                  type="button"
                  onClick={() => setShowTrackDropdown(!showTrackDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-stone-200 bg-gradient-to-r from-white to-stone-50/80 px-4 py-2.5 text-sm text-stone-700 hover:border-rose-300 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <span className="truncate pr-2 font-medium">{playlist[currentTrackIndex]?.name}</span>
                  <motion.div
                    animate={{ rotate: showTrackDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {showTrackDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute z-[200] mt-1 left-0 right-4 rounded-xl bg-white border border-rose-200/60 shadow-lg overflow-visible"
                    >
                      {/* Scroll up button */}
                      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-transparent h-6 pointer-events-none" />
                      
                      {/* Scrollable list */}
                      <div 
                        className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-stone-100 hover:scrollbar-thumb-rose-400 py-1"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#fda4af #f5f5f4'
                        }}
                      >
                        {playlist.map((track, i) => (
                          <button
                            key={track.src}
                            type="button"
                            onClick={() => selectTrack(i)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center gap-2 ${
                              i === currentTrackIndex
                                ? 'bg-gradient-to-r from-rose-50 to-rose-100/50 text-rose-700 font-medium'
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                            }`}
                          >
                            {i === currentTrackIndex && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"
                              />
                            )}
                            <span className="truncate">{track.name}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Scroll down button */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white to-transparent h-6 pointer-events-none" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mb-4 cursor-pointer" onClick={(e) => {
                if (isYouTube) return; // YouTube doesn't support seek via progress bar easily
                const audio = audioRef.current;
                if (!audio || !duration) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                audio.currentTime = x * duration;
              }}>
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center hover:from-rose-600 hover:to-rose-700 hover:scale-105 transition-all duration-200 shrink-0 shadow-md"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={playNext}
                    className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 hover:scale-105 transition-all duration-200"
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
        className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md border border-rose-200/60 shadow-lg flex items-center justify-center text-stone-600 hover:bg-rose-50 hover:text-rose-600 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
        title={expanded ? 'Close music' : 'Music'}
        aria-label="Music controls"
      >
        <Music className={`w-6 h-6 ${isPlaying ? 'text-rose-500' : ''}`} />
      </button>
    </motion.div>
  );
}
