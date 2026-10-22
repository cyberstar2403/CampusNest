export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain';
}

// Module-level cache to track if Supabase render endpoint is active
let supabaseTransformationsSupported: boolean | null = null;

export function setSupabaseTransformSupported(supported: boolean) {
  supabaseTransformationsSupported = supported;
}

export function isSupabaseTransformSupported(): boolean | null {
  return supabaseTransformationsSupported;
}

/**
 * Returns primary (transformed) and fallback (original) URLs for an image source.
 * Tailored for low-bandwidth 1–2 Mbps connections.
 */
export function getOptimizedImageUrl(
  rawUrl: string,
  options: ImageOptimizationOptions = {}
): { primaryUrl: string; fallbackUrl: string } {
  if (!rawUrl) return { primaryUrl: '', fallbackUrl: '' };

  // Data URLs (e.g. base64 previews) do not need transformation
  if (rawUrl.startsWith('data:')) {
    return { primaryUrl: rawUrl, fallbackUrl: rawUrl };
  }

  const { width = 320, height, quality = 65, fit = 'cover' } = options;

  // 1. Unsplash dynamic transformation
  if (rawUrl.includes('images.unsplash.com')) {
    let optUrl = rawUrl;
    if (optUrl.includes('w=')) {
      optUrl = optUrl.replace(/w=\d+/, `w=${width}`);
    } else {
      optUrl += (optUrl.includes('?') ? '&' : '?') + `w=${width}`;
    }

    if (optUrl.includes('q=')) {
      optUrl = optUrl.replace(/q=\d+/, `q=${quality}`);
    } else {
      optUrl += `&q=${quality}`;
    }

    if (!optUrl.includes('auto=format')) {
      optUrl += '&auto=format';
    }

    if (fit === 'cover' && !optUrl.includes('fit=')) {
      optUrl += '&fit=crop';
    }

    return { primaryUrl: optUrl, fallbackUrl: rawUrl };
  }

  // 2. Supabase Storage Public URLs
  if (rawUrl.includes('/storage/v1/object/public/')) {
    const cleanPublicUrl = rawUrl.split('?')[0];

    // If Supabase transformation is known to be unsupported, use clean WebP public URL directly
    if (supabaseTransformationsSupported === false) {
      return { primaryUrl: cleanPublicUrl, fallbackUrl: cleanPublicUrl };
    }

    const renderUrl = cleanPublicUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (fit) params.set('resize', fit);
    if (quality) params.set('quality', quality.toString());

    const primaryUrl = `${renderUrl}?${params.toString()}`;
    return { primaryUrl, fallbackUrl: cleanPublicUrl };
  }

  if (rawUrl.includes('/storage/v1/render/image/public/')) {
    const fallbackUrl = rawUrl.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/').split('?')[0];
    return { primaryUrl: rawUrl, fallbackUrl };
  }

  // 3. Fallback for external static URLs
  return { primaryUrl: rawUrl, fallbackUrl: rawUrl };
}

/**
 * Generates a responsive srcset string for Unsplash and supported endpoints.
 */
export function getResponsiveImageSrcSet(
  rawUrl: string,
  widths: number[] = [320, 480, 640, 800],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string | undefined {
  if (!rawUrl || rawUrl.startsWith('data:')) return undefined;

  if (rawUrl.includes('images.unsplash.com')) {
    return widths
      .map((w) => {
        const { primaryUrl } = getOptimizedImageUrl(rawUrl, { ...options, width: w });
        return `${primaryUrl} ${w}w`;
      })
      .join(', ');
  }

  return undefined;
}

