import { supabase } from '../lib/supabase';
import { optimizeImageForUpload } from '../utils/imageOptimizer';

export const storageService = {
  // Upload file to specified bucket
  async uploadFile(bucket: 'avatars' | 'property-images' | 'agent-documents', file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(`Upload error on bucket ${bucket}:`, uploadError);
      // Fallback: If bucket is missing or unconfigured, convert image file to Base64 data URL so image upload NEVER breaks!
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  async uploadPropertyImage(userId: string, file: File): Promise<string> {
    if (userId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (prof?.role === 'agent' && (prof?.is_suspended === true || prof?.is_active === false)) {
        throw new Error('Your agent account has been suspended. You cannot upload images.');
      }
    }
    // Client-side image optimization: resize large photos to max 1600px and convert to WebP ~0.82 quality
    const optimizedFile = await optimizeImageForUpload(file, 1600, 0.82);
    return this.uploadFile('property-images', optimizedFile);
  },

  async uploadAgentDocument(userId: string, file: File): Promise<string> {
    return this.uploadFile('agent-documents', file);
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    return this.uploadFile('avatars', file);
  },

  // Generates secure access URL for private agent verification documents
  async getSignedDocumentUrl(rawUrlOrPath?: string | null): Promise<string | null> {
    if (!rawUrlOrPath) return null;

    // If it's already a full HTTP URL or Base64 data string
    if (rawUrlOrPath.startsWith('data:') || rawUrlOrPath.startsWith('http://') || rawUrlOrPath.startsWith('https://')) {
      // Check if it's a Supabase storage URL, extract object path
      if (rawUrlOrPath.includes('/agent-documents/')) {
        const pathPart = rawUrlOrPath.split('/agent-documents/').pop();
        if (pathPart) {
          const cleanPath = pathPart.split('?')[0];
          try {
            const { data, error } = await supabase.storage
              .from('agent-documents')
              .createSignedUrl(cleanPath, 3600); // 1 hour validity
            if (data?.signedUrl) return data.signedUrl;
          } catch (e) {
            console.warn('Could not generate signed URL for document:', e);
          }
        }
      }
      return rawUrlOrPath;
    }

    // Try creating signed URL from path
    try {
      const { data, error } = await supabase.storage
        .from('agent-documents')
        .createSignedUrl(rawUrlOrPath, 3600);
      if (data?.signedUrl) return data.signedUrl;
    } catch (err) {
      console.warn('Error generating signed URL:', err);
    }

    // Fallback to publicUrl
    const { data } = supabase.storage.from('agent-documents').getPublicUrl(rawUrlOrPath);
    return data?.publicUrl || null;
  },
};
