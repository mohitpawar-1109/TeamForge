import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Volume2,
  VolumeX,
  Film,
  Image as ImageIcon
} from 'lucide-react';

export const PostMedia = ({ media = [], singleImageUrl = '' }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Normalize media items: support both post.media array and legacy post.image string
  const items = React.useMemo(() => {
    if (Array.isArray(media) && media.length > 0) {
      return media.filter((m) => m && m.url);
    }
    if (singleImageUrl && typeof singleImageUrl === 'string' && singleImageUrl.trim()) {
      return [{ type: 'image', url: singleImageUrl.trim(), name: 'Image attachment' }];
    }
    return [];
  }, [media, singleImageUrl]);

  const imageItems = React.useMemo(
    () => items.filter((m) => m.type === 'image' || (!m.type && !m.url?.match(/\.(mp4|webm|mov|mkv)$/i))),
    [items]
  );
  const videoItems = React.useMemo(
    () => items.filter((m) => m.type === 'video' || m.url?.match(/\.(mp4|webm|mov|mkv)$/i)),
    [items]
  );

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % imageItems.length);
  }, [imageItems.length]);

  const prevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + imageItems.length) % imageItems.length);
  }, [imageItems.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  if (items.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {/* Video Player Section */}
      {videoItems.map((video, idx) => (
        <div
          key={video.fileId || video.url || idx}
          className="relative rounded-2xl overflow-hidden bg-black border border-[#27272A] shadow-md max-h-[480px] flex items-center justify-center group"
        >
          <video
            src={video.url}
            controls
            preload="metadata"
            playsInline
            controlsList="nodownload"
            className="w-full max-h-[480px] object-contain rounded-2xl"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ))}

      {/* Image Gallery Grid */}
      {imageItems.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-[#27272A] bg-[#111113]">
          {imageItems.length === 1 && (
            <div
              onClick={() => openLightbox(0)}
              className="relative max-h-[450px] overflow-hidden cursor-pointer group flex items-center justify-center bg-[#09090B]"
            >
              <img
                src={imageItems[0].url}
                alt={imageItems[0].name || 'Post attachment'}
                loading="lazy"
                className="w-full h-auto max-h-[450px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Click to expand</span>
                </span>
              </div>
            </div>
          )}

          {imageItems.length === 2 && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#111113]">
              {imageItems.map((img, idx) => (
                <div
                  key={img.fileId || img.url || idx}
                  onClick={() => openLightbox(idx)}
                  className="relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer group bg-[#09090B]"
                >
                  <img
                    src={img.url}
                    alt={img.name || `Attachment ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {imageItems.length === 3 && (
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#111113]">
              <div
                onClick={() => openLightbox(0)}
                className="col-span-2 aspect-4/3 rounded-xl overflow-hidden cursor-pointer group relative bg-[#09090B]"
              >
                <img
                  src={imageItems[0].url}
                  alt={imageItems[0].name || 'Attachment 1'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              </div>

              <div className="grid grid-rows-2 gap-1.5">
                {imageItems.slice(1, 3).map((img, idx) => (
                  <div
                    key={img.fileId || img.url || idx}
                    onClick={() => openLightbox(idx + 1)}
                    className="relative rounded-xl overflow-hidden cursor-pointer group bg-[#09090B] h-full"
                  >
                    <img
                      src={img.url}
                      alt={img.name || `Attachment ${idx + 2}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imageItems.length >= 4 && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#111113]">
              {imageItems.slice(0, 4).map((img, idx) => {
                const isLast = idx === 3 && imageItems.length > 4;
                const remainingCount = imageItems.length - 4;

                return (
                  <div
                    key={img.fileId || img.url || idx}
                    onClick={() => openLightbox(idx)}
                    className="relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer group bg-[#09090B]"
                  >
                    <img
                      src={img.url}
                      alt={img.name || `Attachment ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isLast ? (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white font-black text-lg sm:text-xl">
                        +{remainingCount + 1}
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && imageItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Top Bar Controls */}
          <div
            className="absolute top-4 left-4 right-4 flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {activeImageIndex + 1} / {imageItems.length}
              </span>
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Displayed Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageItems[activeImageIndex]?.url}
              alt={imageItems[activeImageIndex]?.name || 'Enlarged media view'}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Navigation Arrows (if multiple images) */}
          {imageItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-white shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-white shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default PostMedia;
