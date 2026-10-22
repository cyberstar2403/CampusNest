import React, { useState, useEffect, useRef } from 'react';
import { 
  getOptimizedImageUrl, 
  getResponsiveImageSrcSet, 
  ImageOptimizationOptions,
  setSupabaseTransformSupported 
} from '../utils/imageUrl';
import { Building2 } from 'lucide-react';

interface OptimizedImageProps extends ImageOptimizationOptions {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  aspectRatio?: string;
  sizes?: string;
  srcSet?: string;
  enableSrcSet?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative overflow-hidden bg-gray-100',
  width = 320,
  height,
  quality = 65,
  fit = 'cover' as const,
  priority = false,
  aspectRatio = '',
  sizes,
  srcSet: customSrcSet,
  enableSrcSet = true,
  onClick,
}) => {
  const { primaryUrl, fallbackUrl } = getOptimizedImageUrl(src, { width, height, quality, fit });

  const [currentSrc, setCurrentSrc] = useState<string>(primaryUrl || fallbackUrl);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [attemptedFallback, setAttemptedFallback] = useState<boolean>(
    !primaryUrl || primaryUrl === fallbackUrl
  );

  // Compute responsive srcSet if enabled and not custom provided
  const computedSrcSet = customSrcSet || (enableSrcSet && !attemptedFallback ? getResponsiveImageSrcSet(src, [320, 480, 640, 800], { quality, fit }) : undefined);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const primaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (primaryTimerRef.current) {
      clearTimeout(primaryTimerRef.current);
      primaryTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  // Reset state and setup timeouts on src or optimization parameter change
  useEffect(() => {
    clearTimers();

    const { primaryUrl: newPrimary, fallbackUrl: newFallback } = getOptimizedImageUrl(src, {
      width,
      height,
      quality,
      fit,
    });

    const hasPrimary = !!newPrimary;
    const hasDifferentFallback = !!newFallback && newFallback !== newPrimary;

    if (!hasPrimary && !hasDifferentFallback) {
      setIsError(true);
      setIsLoaded(true);
      setCurrentSrc('');
      setAttemptedFallback(true);
      return;
    }

    const initialSrc = newPrimary || newFallback;
    const isAlreadyFallback = initialSrc === newFallback || !hasDifferentFallback;

    setCurrentSrc(initialSrc);
    setIsLoaded(false);
    setIsError(false);
    setAttemptedFallback(isAlreadyFallback);

    if (!isAlreadyFallback && hasDifferentFallback) {
      // Primary transformation timeout at 3500ms on slow network
      primaryTimerRef.current = setTimeout(() => {
        setAttemptedFallback(true);
        setCurrentSrc(newFallback);

        // Safety timer for fallback image loading
        fallbackTimerRef.current = setTimeout(() => {
          setIsError(true);
          setIsLoaded(true);
        }, 4500);
      }, 3500);
    } else {
      // Safety 6-second timeout for direct fallback URL so it never hangs indefinitely
      fallbackTimerRef.current = setTimeout(() => {
        setIsError(true);
        setIsLoaded(true);
      }, 6000);
    }

    return () => {
      clearTimers();
    };
  }, [src, width, height, quality, fit]);

  // Check if image was already cached in browser memory
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        clearTimers();
        setIsLoaded(true);
        setIsError(false);
      }
    }
  }, [currentSrc]);

  const handleLoad = () => {
    clearTimers();
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    clearTimers();

    // If a Supabase render URL failed, update global flag so future images don't waste requests
    if (currentSrc.includes('/storage/v1/render/image/public/')) {
      setSupabaseTransformSupported(false);
    }

    const { fallbackUrl: freshFallback } = getOptimizedImageUrl(src, { width, height, quality, fit });

    // Fall back immediately to raw public storage URL if primary fails
    if (!attemptedFallback && currentSrc !== freshFallback && freshFallback) {
      setAttemptedFallback(true);
      setCurrentSrc(freshFallback);

      fallbackTimerRef.current = setTimeout(() => {
        setIsError(true);
        setIsLoaded(true);
      }, 4500);
    } else {
      // Both transformed and raw URLs failed
      setIsError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div onClick={onClick} className={`${containerClassName} ${aspectRatio}`}>
      {/* Background Skeleton Placeholder with Progressive Pulse */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center pointer-events-none">
          <Building2 className="w-8 h-8 text-gray-300" />
        </div>
      )}

      {/* Broken Image Fallback */}
      {isError ? (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-3 text-center text-gray-400">
          <Building2 className="w-8 h-8 mb-1 text-gray-300" />
          <span className="text-[10px] font-medium">Image unavailable</span>
        </div>
      ) : (
        currentSrc && (
          <img
            ref={imgRef}
            src={currentSrc}
            srcSet={computedSrcSet}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'low'}
            onLoad={handleLoad}
            onError={handleError}
            className={`${className} transition-opacity duration-300 ease-in-out ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )
      )}
    </div>
  );
};
