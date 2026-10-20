/**
 * Client-side property image optimization utility.
 * Resizes large photos to a maximum dimension (default 1600px) and converts
 * photographic formats to WebP at ~0.82 quality before uploading.
 */
export async function optimizeImageForUpload(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.82
): Promise<File> {
  // If not an image or is SVG/GIF (non-photographic/animated), return original file
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Do not enlarge small images.
      // Only scale down if width or height exceeds maxDimension.
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If optimization produced a larger blob, keep original file
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const optimizedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
